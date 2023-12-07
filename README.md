# Tosho

## Definição do(s) Problema(s)
1. Ao fazer minhas compras no supermercado, não lembro dos produtos e as quantidades que preciso comprar
2. Ao fazer minhas compras, não consigo saber exatamente o que já peguei e o que ainda falta
3. Ao realizar minhas compras, não sei quanto gastei a cada mês nessas compras

## Definição de Solução
- Uma ferramenta que permite ao usuário realizar suas compras de forma simples, e monitorar o preço das compras ao longo do tempo 

## Jornada de Usuário
- [Imagem do fluxo]()

## Requisitos 
1. Módulo de **autenticação**
    1. Como um usuário eu quero me cadastrar fornecendo e-mail, senha e a confirmação dessa senha para poder usar a aplicação;
    2. Como um usuário eu quero entrar na aplicação fornecendo e-mail e senha para que eu possa usar a aplicação;
    3. Como um usuário eu quero recuperar minha senha através do e-mail para que eu possa mudá-la e usar a aplicação com a nova senha;
2. Módulo de **compras**
    1. Como um usuário eu quero adicionar uma compra a qual eu vou realizar, digitando seu nome e data de realização
        1. Critérios de aceitação: O usuário pode ter no máximo uma compra não concluída por vez
    2. Como um usuário eu quero ver a minha compra atual diretamente na tela principal
        1. Critérios de aceitação: Deve ser possível visualizar toda a compra atual, e apenas ela como foco principal
    3. Como um usuário eu quero editar o nome e a data de realização de uma compra
        1. Critérios de aceitação: Devem ser feitas validações para o nome não ter só espaços em branco, vazio e afins 
    4. Como um usuário eu quero excluir uma compra
        1. Critérios de aceitação: Deve ser necessário pro usuário digitar o nome da compra para confirmar essa ação (que é importante)
    5. Como usuário eu quero ver a lista de compras já concluídas
        1. Critérios de aceitação: Estas compras devem estar ordenadas pela data de realização
    6. Como um usuário eu quero adicionar um ou mais produtos em uma compra, com seu respectivo nome, quantidade (opcional) e categoria (opcional) de uma forma simples apenas através de texto  
        1. Critérios de aceitação: Quantidade e categoria são opcionais, apenas o nome é obrigatório
    7. Como um usuário eu quero visualizar os produtos daquela compra organizados em bloco pela categoria dos produtos
        1. Critérios de aceitação: Os que não tiverem categoria, podem ficar numa categoria separada ao final da lista
    8. Como um usuário eu quero excluir um produto da minha lista
    9. Como um usuário eu quero editar um produto e seus atributos de nome, quantidade, categoria e preço
        1. Critérios de aceitação: Ao digitar preço e quantidade (se não tiver é 1), esse valor é multiplicado e somado ao valor total da compra
    10. Como um usuário eu quero marcar um produto como concluído (adicionado ao carrinho)
        1. Critérios de aceitação: Quando o produto for concluído, o mesmo precisa ir para o carrinho, e seu valor total (se tiver) deve ser somado ao valor total do carrinho
    11. Como um usuário eu quero visualizar o meu carrinho, com os produtos concluídos daquela compra organizados pela categoria dos produtos
        1. Critérios de aceitação: Os que não tiverem categoria, podem ficar numa categoria separada ao final da lista
    12. Como um usuário eu quero marcar uma compra como concluída, através do carrinho de compras
        1. Critérios de aceitação: 
            1. Ao concluir uma compra, será obrigatório inserir o valor total daquela compra, caso não o tenha.
            2. Essa compra deve ir para a lista de compras concluídas
    13. Como um usuário eu quero ver o total atual daquela compra no carrinho
        1. Critérios de aceitação: 
            1. Esse valor pode ser calculado pela soma dos valores dos produtos ao adicionar quantidade e preço, ou pela adição do valor total ao concluir uma compra 
            2. Nas compras concluídas, como não tem carrinho, esse valor deve ser exibido dentro da compra
    14. Como um usuário eu quero mover produto(s) de uma compra para outra
    15. Como um usuário eu quero ver quantos produtos ainda faltam do total de produtos da minha lista
3. Módulo de **estatística**
    1. Como um usuário eu quero visualizar o quanto eu gastei em cada compra ao longo do tempo

## Regras de Negócio
1. Apenas quando uma compra for concluída, o valor total da mesma é computado para análise de gastos ao longo do tempo. Ou seja, apenas compras concluídas terão seu valor total computado nesse módulo;
2. Uma compra e um produto somente podem estar em 1 de 2 estados possíveis: não concluída e concluída;
3. Se os preços e as quantidades forem preenchidas em cada produto, esses valores serão multiplicados, e em seguida somados ao valor total da compra atual;
4. Só é possível concluir uma compra, se o usuário digitar pelo menos o valor total da compra
