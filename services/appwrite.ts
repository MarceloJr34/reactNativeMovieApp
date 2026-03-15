import { Client, Databases, ID, Query } from 'react-native-appwrite';

const client = new Client();
client
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

export const databases = new Databases(client);

export const updateSearchCount = async (query: string, movie: any) => {
    try {
        const res = await databases.listDocuments(
            process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.EXPO_PUBLIC_APPWRITE_TABLE_ID!,
            [Query.equal('searchterm', query)]
        );

        console.log(res);

        //Check if a record of that search has already been stored

        if (res.documents.length > 0) {
            const existingMovie = res.documents[0];
            await databases.updateDocument(
                process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.EXPO_PUBLIC_APPWRITE_TABLE_ID!,
                existingMovie.$id,
                {
                    count: existingMovie.count + 1,
                }
            );
        } else {
            await databases.createDocument('69b691f6001f4b105c14', 'metrics', ID.unique(), {
                searchterm: query,
                movie_id: movie.id,
                count: 1,
                title: movie.title,
                poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
            });
        }
    } catch (error) {
        console.error('Error updating search count:', error);
    }
};

export const getTrendingMovies = async (): Promise<TrendingMovie[] | undefined> => {

    try {
        const result = await databases.listDocuments(process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!, process.env.EXPO_PUBLIC_APPWRITE_TABLE_ID!, [
            Query.limit(5),
            Query.orderDesc('count'),
        ])

        return result.documents as unknown as TrendingMovie[];
    } catch (error) {
        console.error(error);
        return undefined;
    }
}