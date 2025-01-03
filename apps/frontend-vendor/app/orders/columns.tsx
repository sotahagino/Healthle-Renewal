'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';

export type Order = {
  id: string;
  order_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  customer_email: string;
  shipping_name: string;
  shipping_address: string;
  shipping_phone: string;
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
    accessorKey: 'shipping_address',
    header: '配送先',
    cell: ({ row }) => {
      return (
        <div className="text-sm">
          {row.getValue('shipping_address')}
        </div>
      );
    },
  },
  {
    accessorKey: 'customer_email',
    header: 'メールアドレス',
  },
  {
    accessorKey: 'created_at',
    header: '注文日時',
    cell: ({ row }) => {
      return new Date(row.getValue('created_at')).toLocaleString();
    },
  },
]; 