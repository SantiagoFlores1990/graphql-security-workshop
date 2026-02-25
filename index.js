import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import depthLimit from 'graphql-depth-limit';
import { GraphQLError } from 'graphql';
// 1. Esquema y Datos (Se mantienen igual)
const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    posts: [Post]
  }
  type Post {
    id: ID!
    title: String!
    author: User!
  }
  type Query {
    users: [User]
    secretData: String
  }
`;
//2.- Datos de ejemplo
const users = [
    { id: '1', name: 'Frankklin'},
    { id: '2', name: 'Santiago'},
];
const posts = [
    { id: '1', title: 'GraphQL Security', authorId: '1'},
    { id: '2', title: 'GraphQL Best Practices', authorId: '2'},
];
// 2. Resolvers (Con validación de Auth)
const resolvers = {
  Query: {
    users: (parent, args, contextValue) => {
      // 1. Verificamos la autenticación igual que en secretData
      if (!contextValue.user) {
        throw new GraphQLError('No estás autenticado para ver los usuarios', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return users;
    },
    secretData: (parent, args, contextValue) => {
      // Autorización granular a nivel de resolver
      if (!contextValue.user) {
        throw new GraphQLError('No estás autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return `Información confidencial de la empresa, Tu rol confirmado es: ${contextValue.user.role}`;
    },
  },
  User: { posts: (user) => posts.filter(post => post.authorId === user.id) },
  Post: { author: (post) => users.find(user => user.id === post.authorId) }
};
// 3. Iniciar Servidor SEGURO
/*const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: false, // MITIGACIÓN 1: Adiós a la fuga de esquema
  validationRules: [depthLimit(3)], // MITIGACIÓN 2: Límite de anidación (máx 3 niveles)
});*/
// 3. Iniciar Servidor SEGURO
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: false,
  validationRules: [depthLimit(3)],
    // MITIGACIÓN 4: Ocultar detalles internos del servidor (Stacktraces)
  formatError: (formattedError, error) => {
    // Retornamos un objeto limpio solo con el mensaje y el código
    return {
      message: formattedError.message,
      extensions: {
        code: formattedError.extensions?.code
      }
    };
  },
});

// MITIGACIÓN 3: Contexto de Autenticación
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req }) => {
    // Simulamos una lectura de token desde los headers
    const token = req.headers.authorization || '';
    if (token === 'mi-token-super-seguro') {
      return { user: { role: 'admin' } };
    }
    return {}; // Usuario no autenticado
  },
});

console.log(`Servidor SEGURO listo en: ${url}`);
