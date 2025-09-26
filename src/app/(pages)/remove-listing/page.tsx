'use client';

import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';

export default function RemoveListingForm() {
    const [formData, setFormData] = useState({
        type: '',
        listingId: '',
        internalContact: '',
        listingUrl: '',
        reason: '',
        useAlternative: false
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        const finalValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: finalValue,
            // Clear the other method's fields when switching
            ...(name === 'useAlternative' && checked ? { listingId: '' } : {}),
            ...(name === 'useAlternative' && !checked ? { internalContact: '', listingUrl: '' } : {})
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Extract ID from the listing URL
            let itemId: string | null = null;

            try {
                const url = new URL(formData.listingUrl);
                const pathParts = url.pathname.split('/');
                // Look for the last part of the path which should be the ID
                const lastPart = pathParts[pathParts.length - 1];
                if (lastPart && !isNaN(Number(lastPart))) {
                    itemId = lastPart;
                } else {
                    throw new Error('Invalid URL format');
                }
            } catch {
                alert('Invalid listing URL. Please make sure you copied the complete URL from your browser.');
                setLoading(false);
                return;
            }

            // Determine the internal identifier to use
            const internalIdentifier = formData.useAlternative
                ? formData.internalContact
                : formData.listingId;

            if (!internalIdentifier) {
                alert(formData.useAlternative
                    ? 'Please provide your contact email.'
                    : 'Please provide your listing ID.'
                );
                setLoading(false);
                return;
            }

            // Create the authentication header
            const authHeader = internalIdentifier;

            // Determine the API endpoint based on listing type
            const endpoint = formData.type === 'event'
                ? `/api/events/${itemId}`
                : `/api/services/${itemId}`;

            // Make the DELETE request
            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'text/html',
                    'x-delete-auth': authHeader
                }
            });

            if (response.ok) {
                await response.json();
                setSuccess(true);
            } else {
                const errorData = await response.json();

                // Handle different error types with user-friendly messages
                switch (response.status) {
                    case 401:
                        alert('Authentication required. Please check your credentials.');
                        break;
                    case 403:
                        alert('Unauthorized. The provided credentials do not match this listing.');
                        break;
                    case 404:
                        alert('Listing not found. Please check the URL and try again.');
                        break;
                    case 400:
                        alert('Invalid request. Please check all fields and try again.');
                        break;
                    default:
                        alert(`Failed to delete listing: ${errorData.error || 'Unknown error'}`);
                }
            }
        } catch (error) {
            console.error('Error submitting request:', error);
            alert('Failed to submit request. Please check your internet connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const breadcrumbItems = [
        {
            href: '/',
            label: 'The Local Board'
        },
        {
            label: 'Remove Listing'
        }
    ];

    const getSuccessElement = () => {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-text mb-2">
                        Listing Deleted Successfully!
                    </h2>
                    <p className="text-text-secondary mb-4">
                        Your listing has been permanently removed from our platform.
                    </p>
                    <p className="text-text-secondary">
                        Thank you for using The Local Board!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Breadcrumb items={breadcrumbItems} />
            <div className="container mx-auto px-4 py-8">
                {success ? getSuccessElement() :
                    <div className="mx-auto py-8">
                        <h1 className="text-4xl font-bold text-text mb-4">Request to Delete Listing</h1>
                        <p className="text-text-secondary mb-8">
                            Please provide the details of the listing you want to delete. Our team will review your request and process it accordingly.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Listing Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-text mb-4">
                                    Listing Type *
                                </label>
                                <div className="space-y-3">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="service"
                                            checked={formData.type === 'service'}
                                            onChange={handleInputChange}
                                            required
                                            className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                                        />
                                        <span className="text-text">Service</span>
                                    </label>
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="event"
                                            checked={formData.type === 'event'}
                                            onChange={handleInputChange}
                                            required
                                            className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                                        />
                                        <span className="text-text">Event</span>
                                    </label>
                                </div>
                            </div>


                            {/* Listing URL */}
                            <div>
                                <label className="block text-sm font-medium text-text mb-2">
                                    Listing URL *
                                    <input
                                        type="url"
                                        name="listingUrl"
                                        required={true}
                                        value={formData.listingUrl}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                                        placeholder="https://example.com/neighborhoods/downtown/events/123"
                                    />
                                </label>
                                <p className="text-sm text-text-secondary mt-1">
                                    Copy and paste the full URL of your listing from your browser or confirmation email.
                                </p>
                            </div>

                            {/* Listing ID */}
                            <div>
                                <label className="block text-sm font-medium text-text mb-2">
                                    Listing ID *
                                    <input
                                        type="text"
                                        name="listingId"
                                        required={!formData.useAlternative}
                                        value={formData.listingId}
                                        onChange={handleInputChange}
                                        disabled={formData.useAlternative}
                                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2 ${formData.useAlternative ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="Enter the unique ID provided when you created the listing"
                                    />
                                </label>
                                <p className="text-sm text-text-secondary mt-1">
                                    This was provided to you via email when you created the listing.
                                </p>
                            </div>


                            {/* Alternative Method Toggle */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <label className="flex items-center space-x-3 cursor-pointer mb-4">
                                    <input
                                        type="checkbox"
                                        name="useAlternative"
                                        checked={formData.useAlternative}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                    />
                                    <span className="text-text font-medium">I don&apos;t have my listing ID</span>
                                </label>

                                {formData.useAlternative && (
                                    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <p className="text-sm text-text-secondary">
                                            If you don&apos;t have your listing ID, you can identify your listing using the contact email you provided when creating it and the URL to your listing.
                                        </p>

                                        {/* Alternative Contact Email */}
                                        <div>
                                            <label className="block text-sm font-medium text-text mb-2">
                                                Contact Email Used When Creating Listing *
                                                <input
                                                    type="email"
                                                    name="internalContact"
                                                    required={formData.useAlternative}
                                                    value={formData.internalContact}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                                                    placeholder="Enter the email you used when creating the listing"
                                                />
                                            </label>
                                            <p className="text-sm text-text-secondary mt-1">
                                                This is the internal contact email you provided during listing creation.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Reason for Deletion */}
                            <div>
                                <label className="block text-sm font-medium text-text mb-2">
                                    Reason for Deletion
                                    <textarea
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleInputChange}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                                        placeholder="Please explain why you want to delete this listing..."
                                    />
                                </label>
                            </div>



                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-secondary text-white py-3 px-4 rounded-md font-medium hover:bg-secondary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Submitting Request...' : 'Submit Deletion Request'}
                            </button>
                        </form>

                        {/* Help Text */}
                        <div className="mt-8 p-4 bg-surface rounded-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-text mb-2">Need Help?</h3>
                            <p className="text-text-secondary text-sm">
                                If you don&apos;t have your listing ID or need assistance, please contact our support team.
                                We&apos;ll help you identify and remove your listing.
                            </p>
                        </div>
                    </div>
                }
            </div>
        </div>
    );
}
