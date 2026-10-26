<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="CareerPilot AI - Platform manajemen pencarian kerja personal. Catat lamaran kerja, jadwalkan interview, terima triase email rekrutmen, dan persiapkan diri dengan AI.">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'CareerPilot AI') }}</title>
        </x-inertia::head>
    </head>
    <body class="min-h-screen bg-[#0a0a0a] text-[#ffffff] font-sans antialiased selection:bg-[#1e1e1e] selection:text-[#6798ff]">
        <x-inertia::app />
    </body>
</html>
