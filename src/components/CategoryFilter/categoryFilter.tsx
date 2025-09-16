import { Service, Event, EventCategory, ServiceCategory } from "@/types/events";
import { ReactElement } from "react";

type ItemWithCategories<T extends string> = {
    categories: T | T[];
};

type CategoryFilterProps<T extends string, I extends ItemWithCategories<T>> = {
    handleCategoryFilter: (category: T | 'all') => void;
    categoryEnum: Record<string, T>;    
    selectedCategory: T | 'all';
    items: Array<I>;
    filteredItems: Array<I>;
};

function CategoryFilter<T extends string, I extends ItemWithCategories<T>>({ handleCategoryFilter, categoryEnum, selectedCategory, items, filteredItems }: CategoryFilterProps<T, I>): ReactElement {
    return (
        < div className="mb-8" >
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={() => handleCategoryFilter('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                        selectedCategory === 'all'
                            ? 'bg-blue-600 text-white shadow-md'
                            : `bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600`
                    }`}
                >
                    All: ({items.length})
                    
                </button>

                {Object.values(categoryEnum).map((category) => {
                    const categoryCount = items.filter(e => {
                        const categories = Array.isArray(e.categories) ? e.categories : [e.categories];
                        return categories.includes(category as T);
                    }).length;


                    // Capitalize first letter for display
                    const displayName = category.charAt(0).toUpperCase() + category.slice(1);

                    return (
                        <button
                            key={category}
                            onClick={() => handleCategoryFilter(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                                selectedCategory === category
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-300 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            {displayName} ({categoryCount})
                        </button>
                    );
                })}
            </div>

            {
                selectedCategory !== 'all' && (
                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        Showing {filteredItems.length} {selectedCategory}
                    </div>
                )
            }
        </div >
    )
}

export default CategoryFilter;