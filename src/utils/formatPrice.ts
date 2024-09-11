export const formatPrice = (price: number | undefined) => {
  if(price && price > 0){
    const formattedPrice = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
    return formattedPrice
  }
  return 'R$ 0,00'
} 