import React from 'react';

export const FeedPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in-up">
            <h1 className="text-3xl font-bold text-deep-green mb-4">Craive Feed</h1>
            <p className="text-lg text-deep-green/80 max-w-md">
                Connect with fellow food lovers! Share your cravings, discover new recipes, and post your delicious creations. This feature is coming soon!
            </p>
        </div>
    );
};
