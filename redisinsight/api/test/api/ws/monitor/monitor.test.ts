import {
  describe,
  it,
  before,
  deps,
  expect,
  requirements,
  _,
} from '../../deps';
import { Socket } from "socket.io-client";
const { getSocket, constants, rte } = deps;

const getMonitorClient = async (instanceId): Promise<Socket> => {
  return getSocket('monitor', {
    query: { instanceId },
  })
};

describe('monitor', function () {
  this.timeout(4000);

  describe('Client creation', () => {
    it('Should successfully create a client', async () => {
      const client = await getMonitorClient(constants.TEST_INSTANCE_ID);
      expect(client instanceof Socket).to.eql(true);
      await client.close();
    });
    it('Should successfully create a client even when incorrect instanceId provided', async () => {
      const client = await getMonitorClient(constants.TEST_NOT_EXISTED_INSTANCE_ID);
      expect(client instanceof Socket).to.eql(true);
    });
  });

  describe('Emit monitor', () => {
    it('Should successfully emit monitor event', async () => {
      const client = await getMonitorClient(constants.TEST_INSTANCE_ID);
      await new Promise((resolve) => {
        client.emit('monitor', (ack) => {
          expect(ack).to.eql({ status: 'ok' });
          resolve(ack);
        })
      });
    });
    it('Should return Not Found acknowledge on monitor event with incorrect instanceId', async () => {
      try {
        const client = await getMonitorClient(constants.TEST_NOT_EXISTED_INSTANCE_ID);
        await new Promise((resolve, reject) => {
          client.emit('monitor', (ack) => {
            reject('Should fail')
          })
          client.on('exception', reject)
        });
      } catch (e) {
        expect(e.status).to.eql(404);
        expect(e.message).to.eql('Invalid database instance id.');
      }
    });
  });

  describe('On monitorData', () => {
    it('Should receive particular log', async () => {
      const client = await getMonitorClient(constants.TEST_INSTANCE_ID);
      await new Promise((resolve) => {
        client.emit('monitor', async (ack) => {
          expect(ack).to.eql({ status: 'ok' });

          client.on('monitorData', (data) => {
            expect(data).to.be.an('array');
            data.forEach((log) => {
              if (_.isEqual(log.args, ['get', constants.TEST_STRING_KEY_1])) {
                resolve(log);
              }
            });
          });

          await rte.data.executeCommand('get', constants.TEST_STRING_KEY_1);
        })
      });
    });
    it('Should receive bunch of logs for many clients', async () => {
      const clients = await Promise.all(new Array(3)
        .fill(1).map(() => getMonitorClient(constants.TEST_INSTANCE_ID)));

      const counts = {};

      await Promise.all(clients.map((client) => new Promise((resolve, reject) => {
          counts[client.id] = {
            numberOfTargetLogs: 0,
          }

          client.on('exception', reject);
          client.on('monitorData', (data) => {
            expect(data).to.be.an('array');
            data.forEach((log) => {
              if (_.isEqual(log.args, ['get', constants.TEST_NOT_EXISTED_INSTANCE_ID])) {
                counts[client.id].numberOfTargetLogs += 1;
              }
            });
          });
          client.emit('monitor', (ack) => {
            expect(ack).to.eql({ status: 'ok' });
            resolve(ack);
          });
        })
      ));

      await Promise.all((new Array(100).fill(1))
        .map(() => rte.data.executeCommand('get', constants.TEST_NOT_EXISTED_INSTANCE_ID)))

      // Wait for a while
      await new Promise((resolve) => setTimeout(resolve, 2000));

      expect(clients.map((client) => counts[client.id].numberOfTargetLogs)).to.deep.eql([100, 100, 100])
    });
  });

  describe('ACL', () => {
    requirements('rte.acl');
    before(async () => rte.data.setAclUserRules('~* +@all'));

    it('should connect if monitor permitted', async () => {
      const client = await getMonitorClient(constants.TEST_INSTANCE_ACL_ID);

      expect(client instanceof Socket).to.eql(true);

      await new Promise((resolve) => {
        client.emit('monitor', (ack) => {
          expect(ack).to.eql({ status: 'ok' });
          resolve(ack);
        })
      });
      client.close()
    })

    it('should throw an error on connect without permissions', async () => {
      await rte.data.setAclUserRules('~* +@all -monitor');

      const client = await getMonitorClient(constants.TEST_INSTANCE_ACL_ID);

      expect(client instanceof Socket).to.eql(true);

      try {
        await new Promise((resolve, reject) => {
          client.emit('monitor', (ack) => {
            expect(ack).to.eql({status: 'ok'});
            reject(new Error("should throw NOPERM Error"));
          })
          client.on('exception', reject);
        });
      } catch (e) {
        expect(e.status).to.eql(403);
        expect(e.message).to.have.string('NOPERM');
      }
    })
  });
});
