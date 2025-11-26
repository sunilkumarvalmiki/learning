import React from 'react';
import './DocumentCardSkeleton.css';

export interface DocumentCardSkeletonProps {
    /** Number of skeleton cards to show */
    count?: number;
}

/**
 * Skeleton loading placeholder for document cards
 * Shows animated placeholders while documents are loading
 * 
 * @example
 * ```tsx
 * {loading ? (
 *   <DocumentCardSkeleton count={10} />
 * ) : (
 *   documents.map(doc => <DocumentCard doc={doc} />)
 * )}
 * ```
 */
export const DocumentCardSkeleton: React.FC<DocumentCardSkeletonProps> = ({ count = 10 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="document-card-skeleton" aria-busy="true" aria-label="Loading document">
                    <div className="skeleton__header">
                        <div className="skeleton__title" />
                        <div className="skeleton__badge" />
                    </div>
                    <div className="skeleton__body">
                        <div className="skeleton__line skeleton__line--short" />
                        <div className="skeleton__line skeleton__line--medium" />
                        <div className="skeleton__line skeleton__line--long" />
                    </div>
                    <div className="skeleton__footer">
                        <div className="skeleton__meta" />
                        <div className="skeleton__meta skeleton__meta--small" />
                    </div>
                </div>
            ))}
        </>
    );
};
