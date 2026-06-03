"use client"

import React from 'react';
import { useState, FormEvent } from 'react';
import Head from 'next/head';
import { useAuth } from '@clerk/nextjs';
import DatePicker from 'react-datepicker';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { Protect, PricingTable, UserButton } from '@clerk/nextjs';
import {
    BTN_GENERATE_SUMMARY,
    BTN_GENERATING_SUMMARY,
    CLERK_PLAN_PREMIUM,
    DATE_FORMAT,
    FORM_HEADING,
    LABEL_CONSULTATION_NOTES,
    LABEL_DATE_OF_VISIT,
    LABEL_PATIENT_NAME,
    MSG_AUTH_REQUIRED,
    MSG_CONNECTION_ERROR,
    NOTICE_PHI_WARNING,
    PLACEHOLDER_DATE,
    PLACEHOLDER_NOTES,
    PLACEHOLDER_PATIENT_NAME,
    PRICING_HEADER_SUBTITLE,
    PRICING_HEADER_TITLE,
    PRODUCT_PAGE_META_DESCRIPTION,
    PRODUCT_PAGE_TITLE,
    TEXTAREA_ROWS,
} from '../constants/ui_constants';

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? '';
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, '');
const CONSULTATION_ENDPOINT = API_BASE_URL ? `${API_BASE_URL}/api/consultation` : '/api/consultation';

function ConsultationForm() {
    const { getToken } = useAuth();

    // Form state
    const [patientName, setPatientName] = useState('');
    const [visitDate, setVisitDate] = useState<Date | null>(new Date());
    const [notes, setNotes] = useState('');

    // Streaming state
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setOutput('');
        setLoading(true);

        const jwt = await getToken();
        if (!jwt) {
            setOutput(MSG_AUTH_REQUIRED);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        let buffer = '';

        try {
            await fetchEventSource(CONSULTATION_ENDPOINT, {
                signal: controller.signal,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify({
                    patient_name: patientName,
                    date_of_visit: visitDate?.toISOString().slice(0, 10),
                    notes,
                }),
                onmessage(ev) {
                    if (ev.event === 'error') {
                        setOutput(`Error: ${ev.data}`);
                        setLoading(false);
                        controller.abort();
                        return;
                    }
                    buffer += ev.data;
                    setOutput(buffer);
                },
                onclose() {
                    setLoading(false);
                },
                onerror(err) {
                    console.error('SSE error:', err);
                    controller.abort();
                    setLoading(false);
                    setOutput(MSG_CONNECTION_ERROR);
                    throw err;
                },
            });
        } catch (err) {
            console.error('Consultation request failed:', err);
            setOutput(MSG_CONNECTION_ERROR);
            setLoading(false);
        }
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">
                {FORM_HEADING}
            </h1>

            <div role="alert" className="flex items-start gap-3 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 rounded-lg px-4 py-3 mb-6">
                <span className="text-red-600 dark:text-red-400 text-xl leading-none mt-0.5" aria-hidden="true">⚠️</span>
                <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>{NOTICE_PHI_WARNING}</strong>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <div className="space-y-2">
                    <label htmlFor="patient" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {LABEL_PATIENT_NAME}
                    </label>
                    <input
                        id="patient"
                        type="text"
                        required
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder={PLACEHOLDER_PATIENT_NAME}
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {LABEL_DATE_OF_VISIT}
                    </label>
                    <DatePicker
                        id="date"
                        selected={visitDate}
                        onChange={(d: Date | null) => setVisitDate(d)}
                        dateFormat={DATE_FORMAT}
                        placeholderText={PLACEHOLDER_DATE}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {LABEL_CONSULTATION_NOTES}
                    </label>
                    <textarea
                        id="notes"
                        required
                        rows={TEXTAREA_ROWS}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder={PLACEHOLDER_NOTES}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                    {loading ? BTN_GENERATING_SUMMARY : BTN_GENERATE_SUMMARY}
                </button>
            </form>

            {output && (
                <section className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg p-8">
                    <div className="markdown-content prose prose-blue dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                            {output}
                        </ReactMarkdown>
                    </div>
                </section>
            )}
        </div>
    );
}

export default function Product() {
    return (
        <>
            <Head>
                <title>{PRODUCT_PAGE_TITLE}</title>
                <meta name="description" content={PRODUCT_PAGE_META_DESCRIPTION} />
            </Head>
            <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                {/* User Menu in Top Right */}
                <div className="absolute top-4 right-4">
                    <UserButton showName={true} />
                </div>

                {/* Subscription Protection */}
                <Protect
                    plan={CLERK_PLAN_PREMIUM}
                    fallback={
                        <div className="container mx-auto px-4 py-12">
                            <header className="text-center mb-12">
                                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                                    {PRICING_HEADER_TITLE}
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
                                    {PRICING_HEADER_SUBTITLE}
                                </p>
                            </header>
                            <div className="max-w-4xl mx-auto">
                                <PricingTable />
                            </div>
                        </div>
                    }
                >
                    <ConsultationForm />
                </Protect>
            </main>
        </>
    );
}
