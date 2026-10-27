<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Trusted Proxies
    |--------------------------------------------------------------------------
    |
    | Set the IP addresses of proxies that should be trusted. You may specify
    | a comma-separated string, an array of IP addresses, or '*' to trust all
    | proxies (e.g. Behind load balancers/reverse proxies).
    |
    */

    'proxies' => env('TRUSTED_PROXIES', [
        '127.0.0.1',
        '::1',
        '10.0.0.0/8',
        '172.16.0.0/12',
        '192.168.0.0/16',
    ]),

];
