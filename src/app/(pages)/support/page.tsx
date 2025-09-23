'use client';

import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';

export default function SupportPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
        listingUrl: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/support', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setSuccess(true);
            } else {
                const errorData = await response.json();
                alert(`Failed to send message: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error sending support message:', error);
            alert('Failed to send message. Please check your internet connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const breadcrumbItems = [
        { label: 'The Local Board', href: '/' },
        { label: 'Support' }
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
                        Message Sent Successfully!
                    </h2>
                    <p className="text-text-secondary mb-4">
                        Thank you for contacting us. We&apos;ve received your message and will get back to you as soon as possible.
                    </p>
                    <p className="text-text-secondary">
                        You should receive a confirmation email shortly.
                    </p>
                    <button
                        onClick={() => {
                            setSuccess(false);
                            setFormData({
                                name: '',
                                email: '',
                                subject: '',
                                message: '',
                                listingUrl: ''
                            });
                        }}
                        className="mt-6 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        Send Another Message
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <Breadcrumb items={breadcrumbItems} />
                {success ? getSuccessElement() :
                    <div className="max-w-2xl mx-auto">
                        <h1 className="text-4xl font-bold text-text mb-4">Contact Support</h1>
                        <p className="text-text-secondary mb-8">
                            Need help with something? Have a question about a listing? We&apos;re here to help!
                            Send us a message and we&apos;ll get back to you as soon as possible.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name and Email */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text mb-2">
                                        Your Name *
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                                            placeholder="Enter your full name"
                                        />
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text mb-2">
                                        Email Address *
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                                            placeholder="your.email@example.com"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-text mb-2">
                                    Subject *
                                    <select
                                        name="subject"
                                        required
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                                    >
                                        <option value="">Please select a subject</option>
                                        <option value="listing-issue">Issue with a Listing</option>
                                        <option value="account-help">Account Help</option>
                                        <option value="technical-problem">Technical Problem</option>
                                        <option value="content-report">Report Inappropriate Content</option>
                                        <option value="feature-request">Feature Request</option>
                                        <option value="general-inquiry">General Inquiry</option>
                                        <option value="other">Other</option>
                                    </select>
                                </label>
                            </div>

                            {/* Optional Listing URL */}
                            <div>
                                <label className="block text-sm font-medium text-text mb-2">
                                    Related Listing URL (Optional)
                                    <input
                                        type="url"
                                        name="listingUrl"
                                        value={formData.listingUrl}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                                        placeholder="https://example.com/neighborhoods/downtown/events/123"
                                    />
                                </label>
                                <p className="text-sm text-text-secondary mt-1">
                                    If your message is about a specific event or service, please include the URL here.
                                </p>
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-sm font-medium text-text mb-2">
                                    Message *
                                    <textarea
                                        name="message"
                                        required
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        rows={6}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                                        placeholder="Please describe your issue or question in detail..."
                                    />
                                </label>
                                <p className="text-sm text-text-secondary mt-1">
                                    Please provide as much detail as possible to help us assist you better.
                                </p>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-secondary text-white py-3 px-4 rounded-md font-medium hover:bg-secondary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Sending Message...' : 'Send Message'}
                            </button>
                        </form>

                        {/* Additional Help */}
                        <div className="mt-12 space-y-6">
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                                <h2 className="text-2xl font-bold text-text mb-4">Other Ways to Get Help</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-surface rounded-lg border border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-semibold text-text mb-2">Frequently Asked Questions</h3>
                                        <p className="text-text-secondary text-sm mb-3">
                                            Check out our FAQ section for answers to common questions.
                                        </p>
                                        <button className="text-primary hover:text-primary-dark font-medium text-sm">
                                            View FAQ →
                                        </button>
                                    </div>

                                    <div className="p-4 bg-surface rounded-lg border border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-semibold text-text mb-2">Community Guidelines</h3>
                                        <p className="text-text-secondary text-sm mb-3">
                                            Learn about our community standards and best practices.
                                        </p>
                                        <button className="text-primary hover:text-primary-dark font-medium text-sm">
                                            Read Guidelines →
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h3 className="text-lg font-semibold text-text mb-2">Response Time</h3>
                                <p className="text-text-secondary text-sm">
                                    We typically respond to support messages within 24-48 hours during business days.
                                    For urgent matters, please include &quot;URGENT&quot; in your subject line.
                                </p>
                            </div>
                        </div>
                    </div>
                }
            </div>
        </div>
    );
}
