/**
 * Dados fixos de desenvolvimento. UUIDs estáveis permitem rodar o seed várias vezes
 * sem duplicar linhas — o repositório faz upsert pelo id.
 */
export const SEED_USERS = {
  admin: {
    id: "11111111-1111-4111-8111-111111111101",
    name: "Admin Demo",
    email: "admin@pizzaria.local",
    password: "admin12345",
    role: "ADMIN" as const,
  },
  customer: {
    id: "11111111-1111-4111-8111-111111111102",
    name: "Cliente Demo",
    email: "cliente@pizzaria.local",
    password: "cliente12345",
    role: "CUSTOMER" as const,
  },
};

export const SEED_PRODUCTS = [
  {
    id: "22222222-2222-4222-8222-222222222201",
    name: "Margherita",
    description: "Molho de tomate, mussarela e manjericão",
    priceInCents: 4500,
    category: "PIZZA",
    isAvailable: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222202",
    name: "Calabresa",
    description: "Calabresa fatiada, cebola e azeitonas",
    priceInCents: 4800,
    category: "PIZZA",
    isAvailable: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222203",
    name: "Quatro Queijos",
    description: "Mussarela, gorgonzola, parmesão e provolone",
    priceInCents: 5200,
    category: "PIZZA",
    isAvailable: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222204",
    name: "Frango com Catupiry",
    description: "Frango desfiado e catupiry",
    priceInCents: 5000,
    category: "PIZZA",
    isAvailable: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222205",
    name: "Portuguesa",
    description: "Presunto, ovo, cebola, ervilha e azeitonas",
    priceInCents: 4900,
    category: "PIZZA",
    isAvailable: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222206",
    name: "Refrigerante 2L",
    description: "Coca-Cola, Guaraná ou Fanta",
    priceInCents: 1200,
    category: "BEBIDA",
    isAvailable: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222207",
    name: "Suco Natural 500ml",
    description: "Laranja ou limão",
    priceInCents: 900,
    category: "BEBIDA",
    isAvailable: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222208",
    name: "Pizza Especial da Casa (esgotada)",
    description: "Exemplo de produto indisponível no cardápio",
    priceInCents: 5500,
    category: "PIZZA",
    isAvailable: false,
  },
] as const;
