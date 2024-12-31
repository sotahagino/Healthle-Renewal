'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';

export type Order = {
  id: string;
  order_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  shipping_info: {
    name: string;
    postal_code: string;
    prefecture: string;
    city: string;
    address: string;
  };
};

export const columns: ColumnDef<Order>[] = [
  {
    accessorKey: 'order_id',
    header: '注文ID',
    cell: ({ row }) => {
      const id = row.original.id;
      return (
        <Link
          href={`/orders/${id}`}
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {row.getValue('order_id')}
        </Link>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'ステータス',
  },
  {
    accessorKey: 'total_amount',
    header: '合計金額',
    cell: ({ row }) => {
      const amount = row.getValue('total_amount') as number;
      return `¥${amount.toLocaleString()}`;
    },
  },
  {
    accessorKey: 'shipping_info',
    header: '配送先',
    cell: ({ row }) => {
      const shipping = row.getValue('shipping_info') as Order['shipping_info'];
      return shipping ? (
        <div>
          <div>{shipping.name}</div>
          <div className="text-sm text-gray-500">
            〒{shipping.postal_code} {shipping.prefecture}{shipping.city}{shipping.address}
          </div>
        </div>
      ) : null;
    },
  },
  {
    accessorKey: 'created_at',
    header: '注文日時',
    cell: ({ row }) => {
      return new Date(row.getValue('created_at')).toLocaleString();
    },
  },
]; 