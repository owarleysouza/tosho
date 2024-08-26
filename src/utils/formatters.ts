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

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000); // Convertendo de segundos para milissegundos
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses começam do 0
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}