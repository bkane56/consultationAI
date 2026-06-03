"use client"

import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import {
    APP_NAME,
    APP_DESCRIPTION,
    FEATURES,
    FOOTER_TRUST_LINE,
    LABEL_GO_TO_APP,
    LABEL_OPEN_CONSULTATION_ASSISTANT,
    LABEL_SIGN_IN,
    LABEL_START_FREE_TRIAL,
    NOTICE_DEMO_BODY,
    NOTICE_DEMO_TITLE,
    ROUTE_PRODUCT,
} from '../constants/ui_constants';

export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-12">
                {/* Navigation */}
                <nav className="flex justify-between items-center mb-12">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        {APP_NAME}
                    </h1>
                    <div>
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                                    {LABEL_SIGN_IN}
                                </button>
                            </SignInButton>
                        </SignedOut>
                        <SignedIn>
                            <div className="flex items-center gap-4">
                                <Link
                                    href={ROUTE_PRODUCT}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                                >
                                    {LABEL_GO_TO_APP}
                                </Link>
                                <UserButton showName={true} />
                            </div>
                        </SignedIn>
                    </div>
                </nav>

                <div className="mb-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
                    <p className="font-semibold">{NOTICE_DEMO_TITLE}</p>
                    <p>{NOTICE_DEMO_BODY}</p>
                </div>

                {/* Hero Section */}
                <div className="text-center py-16">
                    <h2 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
                        Transform Your
                        <br />
                        Consultation Notes
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
                        {APP_DESCRIPTION}
                    </p>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
                        {FEATURES.map((feature, index) => (
                            <div key={index} className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                                <div className="relative bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                                    <div className="text-3xl mb-4">{feature.icon}</div>
                                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{feature.title}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105">
                                {LABEL_START_FREE_TRIAL}
                            </button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn>
                        <Link
                            href={ROUTE_PRODUCT}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 inline-block"
                        >
                            {LABEL_OPEN_CONSULTATION_ASSISTANT}
                        </Link>
                    </SignedIn>
                </div>

                {/* Trust Indicators */}
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>{FOOTER_TRUST_LINE}</p>
                </div>
            </div>
        </main>
    );
}
