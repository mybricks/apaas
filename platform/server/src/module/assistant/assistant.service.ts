import { Injectable } from '@nestjs/common';
import { configuration } from '../../utils/shared';
import { Logger } from '@mybricks/rocker-commons';
import axios from 'axios';

export class AIServiceNotAvailableError extends Error {
  constructor(message: string = '当前平台未提供AI服务') {
    super(message);
    this.name = 'AIServiceNotAvailableError';
  }
}

@Injectable()
export default class AssistantService {
  async getAIToken() {
    return configuration?.ai?.accessToken;
  }

  async checkAICenterHealth(): Promise<boolean> {
    try {
      const response = await axios.get('https://ai.mybricks.world/health');
      return response.status === 200;
    } catch (error) {
      Logger.error(error?.stack?.toString())
      return false
    }
  }

  async streamToAICenter(body: any, headers: any) {
    const aiToken = configuration?.ai?.accessToken;
    if (!aiToken) {
      throw new AIServiceNotAvailableError();
    }

    return await axios.post('https://ai.mybricks.world/stream-with-tools', body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiToken}`,
        'm-request-role': headers['m-request-role']
      },
      responseType: 'stream'
    });
  }
} 