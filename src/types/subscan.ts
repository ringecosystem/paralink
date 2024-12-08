// ... existing code ...

interface ExtrinsicParam {
  name: string;
  type: string;
  type_name: string;
  value: any;
}

interface EventParam {
  type: string;
  type_name: string;
  value: string | null | object;
  name: string;
}

interface Event {
  event_index: string;
  block_num: number;
  extrinsic_idx: number;
  module_id: string;
  event_id: string;
  params: string | EventParam[];
  phase: number;
  event_idx: number;
  extrinsic_hash: string;
  finalized: boolean;
  block_timestamp: number;
}

interface AccountDisplay {
  address: string;
}

interface Lifetime {
  birth: number;
  death: number;
}

interface ExtrinsicData {
  block_timestamp: number;
  block_num: number;
  extrinsic_index: string;
  call_module_function: string;
  call_module: string;
  account_id: string;
  signature: string;
  nonce: number;
  extrinsic_hash: string;
  success: boolean;
  params: ExtrinsicParam[];
  transfer: null;
  event: Event[];
  event_count: number;
  fee: string;
  fee_used: string;
  error: null | string;
  finalized: boolean;
  lifetime: Lifetime;
  tip: string;
  account_display: AccountDisplay;
  block_hash: string;
  pending: boolean;
  sub_calls: null | any[];
}

export type SubscanExtrinsicResponse =
  | {
      code: number;
      message: string;
      generated_at: number;
      data: ExtrinsicData;
    }
  | {
      code: -1;
      message: string;
      data: null;
    };
