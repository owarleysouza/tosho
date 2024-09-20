import React from 'react';

import { Product } from '@/types';

import { Wallet } from 'lucide-react';

import { formatPrice } from '@/utils/formatPrice';

interface CompletedShopPriceCardProps {
  products: Product[];
  completedShopPrice?: number;
}

const CompletedShopPriceCard: React.FC<CompletedShopPriceCardProps> = ({
  products,
  completedShopPrice,
}) => {
  function calculateShopPrice() {
    let total = 0;

    products.forEach((product) => {
      total += product.quantity * (product.price ? product.price : 0);
    });

    return total;
  }

  function formatShopTotalPrice() {
    const total =
      completedShopPrice && completedShopPrice > 0
        ? completedShopPrice
        : calculateShopPrice();
    const shopPrice = formatPrice(total);

    return shopPrice;
  }

  function isTotalPriceDefinedByUser() {
    if (completedShopPrice) return completedShopPrice != calculateShopPrice();
    return false;
  }

  return (
    <section className="flex flex-row items-center max-w-[316px] justify-between bg-secondary py-5 px-5 rounded-2xl border border-accent gap-2 my-3">
      <div className="flex flex-row items-center gap-3">
        <Wallet className="h-9 w-9" />
        <div className="flex flex-col">
          <span className="text-xs text-slate-400">Total da compra</span>
          <h1 className="text-2xl text-black font-bold break-all ...">
            {formatShopTotalPrice()}
          </h1>
          {isTotalPriceDefinedByUser() && (
            <span className="text-[8px]">
              * Preço total inserido na conclusão da compra
            </span>
          )}
        </div>
      </div>
    </section>
  );
};

export default CompletedShopPriceCard;
