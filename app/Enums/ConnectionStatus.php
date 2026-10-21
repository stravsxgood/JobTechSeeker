<?php

namespace App\Enums;

enum ConnectionStatus: string
{
    case Connected = 'connected';
    case ReauthorizationRequired = 'reauthorization_required';
    case Disconnected = 'disconnected';
    case SyncError = 'sync_error';
}
