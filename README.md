# Tosho

## Definição do(s) Problema(s)
1. Ao fazer minhas compras no supermercado, não lembro dos produtos e as quantidades que preciso comprar
2. Ao fazer minhas compras, não consigo saber exatamente o que já peguei e o que ainda falta
3. Ao realizar minhas compras, não sei quanto gastei a cada mês nessas compras

## Definição de Solução
- Uma ferramenta que permite ao usuário realizar suas compras de forma simples, e monitorar o preço das compras ao longo do tempo 

## Jornada de Usuário
- [Imagem do fluxo]()

## Regras de Negócio
1. Apenas quando uma compra for concluída, o valor total da mesma é computado para análise de gastos ao longo do tempo. Ou seja, apenas compras concluídas terão seu valor total computado nesse módulo;
2. Uma compra e um produto somente podem estar em 1 de 2 estados possíveis: não concluída e concluída;
3. Se os preços e as quantidades forem preenchidas em cada produto, esses valores serão multiplicados, e em seguida somados ao valor total da compra atual;
4. Só é possível concluir uma compra, se o usuário digitar pelo menos o valor total da compra
