import { Logger } from '@nestjs/common';
import { ReplyError } from 'src/models';
import { BrowserToolService } from 'src/modules/browser/services/browser-tool/browser-tool.service';
import { IFindRedisClientInstanceByOptions } from 'src/modules/core/services/redis/redis.service';
import { GetKeyInfoResponse, RedisDataType } from 'src/modules/browser/dto';
import {
  BrowserToolKeysCommands,
  BrowserToolStringCommands,
} from 'src/modules/browser/constants/browser-tool-commands';
import { RedisString } from 'src/common/constants';
import { IKeyInfoStrategy } from '../../key-info-manager.interface';

export class StringTypeInfoStrategy implements IKeyInfoStrategy {
  private logger = new Logger('StringTypeInfoStrategy');

  private readonly redisManager: BrowserToolService;

  constructor(redisManager: BrowserToolService) {
    this.redisManager = redisManager;
  }

  public async getInfo(
    clientOptions: IFindRedisClientInstanceByOptions,
    key: RedisString,
    type: string,
  ): Promise<GetKeyInfoResponse> {
    this.logger.log(`Getting ${RedisDataType.String} type info.`);
    const [
      transactionError,
      transactionResults,
    ] = await this.redisManager.execPipeline(clientOptions, [
      [BrowserToolKeysCommands.Ttl, key],
      [BrowserToolKeysCommands.MemoryUsage, key, 'samples', '0'],
      [BrowserToolStringCommands.StrLen, key],
    ]);
    if (transactionError) {
      throw transactionError;
    } else {
      const result = transactionResults.map(
        (item: [ReplyError, any]) => item[1],
      );
      const [ttl, size, length] = result;
      return {
        name: key,
        type,
        ttl,
        size: size || null,
        length,
      };
    }
  }
}
