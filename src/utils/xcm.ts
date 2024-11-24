import type { MultiLocation } from '@polkadot/types/interfaces';
import { cloneDeep, transform, isObject, isEqual } from 'lodash-es';
import { removeCommasAndConvertToNumber } from './number';

function normalizeXcmLocation(location) {
  const normalize = (obj) => {
    // 如果是数组，需要递归处理数组中的每个元素
    if (Array.isArray(obj)) return obj.map((item) => normalize(item));

    // 如果不是对象或是 null，需要特殊处理
    if (!isObject(obj) || obj === null) {
      const strValue = String(obj).replace(/,/g, '');
      // 尝试转换为数字
      const numValue = removeCommasAndConvertToNumber(strValue);
      return numValue;
    }

    // 处理对象
    return transform(obj, (result: any, value: any, key: string) => {
      const newKey = key.toLowerCase();
      result[newKey] = isObject(value)
        ? normalize(value)
        : (() => {
            const strValue = String(value).replace(/,/g, '');
            const numValue = Number(strValue);
            return !isNaN(numValue) ? numValue : strValue;
          })();
    });
  };

  return normalize(cloneDeep(location));
}
/**
 * 比较两个 XCM Location 是否匹配
 * @param location1 第一个 location (通常是从 API 获取的)
 * @param location2 第二个 location (通常是从配置解析的)
 * @returns 是否匹配
 */
export function isXcmLocationMatch(
  location1: MultiLocation | null | undefined,
  location2: MultiLocation | null | undefined
): boolean {
  if (!location1 || !location2) return false;
  // 先标准化两个位置数据
  const normalized1 = normalizeXcmLocation(location1);
  const normalized2 = normalizeXcmLocation(location2);

  return isEqual(normalized1, normalized2);
}
