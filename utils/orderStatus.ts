export type VendorOrderStatus = 'received' | 'dispatched' | 'completed';

export type CustomerOrderStatusLabel = 'pending' | 'in-transit' | 'delivered';

export function vendorStatusToCustomer(
  vendorStatus: string | null | undefined
): CustomerOrderStatusLabel {
  switch (vendorStatus) {
    case 'received':
      return 'pending';
    case 'dispatched':
      return 'in-transit';
    case 'completed':
      return 'delivered';
    default:
      return 'pending';
  }
}

export function customerStatusDisplay(status: CustomerOrderStatusLabel): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'in-transit':
      return 'In transit';
    case 'delivered':
      return 'Delivered';
    default:
      return 'Pending';
  }
}

export function vendorStatusDisplay(status: VendorOrderStatus | string): string {
  switch (status) {
    case 'received':
      return 'Received';
    case 'dispatched':
      return 'Dispatched';
    case 'completed':
      return 'Completed';
    default:
      return String(status);
  }
}

export function isOrderFullyDelivered(
  itemStatuses: Array<string | null | undefined>
): boolean {
  if (itemStatuses.length === 0) return false;
  return itemStatuses.every((s) => s === 'completed');
}

export function isOrderActive(
  itemStatuses: Array<string | null | undefined>
): boolean {
  return !isOrderFullyDelivered(itemStatuses);
}
