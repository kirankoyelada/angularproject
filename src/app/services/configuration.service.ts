import { Injectable, Inject } from '@angular/core';

export class Configuration {

  // The values that are defined here are the default values that can
  // be overridden by appSettings.js

  production: boolean = true;
  apiURL: string;
  inBoundHostAddress: string;
  
  idleTime: number = 28800; //in seconds
  sessionTimeOut: number = 10;
  browseMaxRecords: number = 30;
  maxRecordLength: number = 5000;
  spinnerTimeout: number = 2000;
  refreshServiceDelay: number = 1800; //in seconds
  azureAppInsightsInstrumentationKey: string;
  feedSources: string = "B & T,CLS,OCDB,ALEXMAIN,JB";
}

@Injectable()
export class ConfigurationService {
  _configuration: Configuration;

  setConfiguration(configuration: Configuration): void {
    this._configuration = configuration;
  }

  currentConfiguration(): Configuration {
      return this._configuration;
  }
}

