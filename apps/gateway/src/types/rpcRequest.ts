export interface RpcRequest {
  requestId?: string;
  schemaName?: string;
  [key: string]: any;
}
