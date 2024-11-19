export function findBestWssEndpoint(
  endpoints: Record<string, string>
): string | undefined {
  // 过滤出所有 wss 端点
  const wssEndpoints = Object.entries(endpoints).filter(([, url]) =>
    url.startsWith('wss://')
  );

  // 如果没有 wss 端点，返回 undefined
  if (!wssEndpoints.length) return undefined;

  // 优先查找 onfinality
  const onfinality = wssEndpoints.find(([name]) =>
    name.toLowerCase().includes('onfinality')
  );
  if (onfinality) return onfinality[1];

  // 其次查找 dwellir
  const dwellir = wssEndpoints.find(([name]) =>
    name.toLowerCase().includes('dwellir')
  );
  if (dwellir) return dwellir[1];

  // 最后返回第一个 wss 端点
  return wssEndpoints[0][1];
}
