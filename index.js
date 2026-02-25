// 1.- Definición del esquema GraphQL

import{ ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

const typeDefs = `# GraphQL schema definition
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
    secureData: String
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

// 3.- Resolvers
const resolvers = {
    Query: {
        users: () => users,
        secureData: () => "This is secure data! - Información confidencial de la empresa",
    },
    User: {
        posts: (user) => posts.filter(post => post.authorId === user.id),
    },
    Post: {
        author: (post) => users.find(user => user.id === post.authorId),
    },
};

// 4.- Configuración del servidor Apollo Inseuro
const server = new ApolloServer({
    typeDefs,
    resolvers,
});

const{url} = await startStandaloneServer(server, {
    listen: { port: 4000 },
});

console.log(`Server Inseguro listo en: ${url}`);