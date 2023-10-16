export interface Env {
  API_TOKEN: string;
  SLACK_URL: string;
}

const gatherResponse = async (response: Response) => {
  const { headers } = response;
  const contentType = headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return JSON.stringify(await response.json());
  } else if (contentType.includes('application/text')) {
    return response.text();
  } else if (contentType.includes('text/html')) {
    return response.text();
  } else {
    return response.text();
  }
}

const handleRequest = async (url: string, text: string) => {
  const body = {
    text: text,
  };

  const init = {
    body: JSON.stringify(body),
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
  };
  const response = await fetch(url, init);
  const results = await gatherResponse(response);
  return new Response(results, init);
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
    const params: Record<string, string> = {};
    const url = new URL(request.url);
    url.search.slice(1).split('&').map(item => {
      const kv = item.split('=');
      if (kv[0]) params[kv[0]] = kv[1] || '';
    });
    if (
      Object.keys(params).length === 0 ||
      !('token' in params) ||
      params.token !== env.API_TOKEN ||
      !('battery' in params) ||
      !('tempmsb' in params) ||
      !('templsb' in params) ||
      !('hum' in params)
    ) {
      return new Response('');
    }
    const batteryTmp = (Number(params.battery) - 6) / 25 * 100;
    const remainBattery = batteryTmp > 100 ? 100 : batteryTmp < 0 ? 0 : batteryTmp;
    const tempMsb = Number(params.tempmsb);
    const tempLsb = Number(params.templsb);
    const tmp = (tempLsb + tempMsb * 256 - 200) / 8;
    const hum = Number(params.hum) / 2;

    return handleRequest(env.SLACK_URL, `電池: ${remainBattery.toFixed(2)}%, 温度: ${tmp.toFixed(2)}度, 湿度: ${hum.toFixed(2)}%です。`);
	},
};
