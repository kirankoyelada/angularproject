import { Injectable } from '@angular/core';
import { ConfigurationService } from 'src/app/services/configuration.service';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {

  _loading: boolean = false;
  _loadingDefault:boolean = false;
  _spinnerTimeout: number = 1;

  isSpinnerRequired:boolean = false;

  constructor(private configurationService: ConfigurationService) {
    this._spinnerTimeout = configurationService.currentConfiguration().spinnerTimeout;
  }

  get loading(): boolean {
      return this._loading;
  }

  get loadingDefault(): boolean {
    return this._loadingDefault;
}

onRequestStarted(): void {
  this._loading = true;
}

  onloadingDefault(): void {
      this._loadingDefault = true;
  }

  onloadingFinish(): void {
    this._loadingDefault = false;
}

  onRequestFinished(): void {
      this._loading = false;
      this._loadingDefault = false;
  }

   spinnerRequired(value : boolean): void {
     this.isSpinnerRequired = value;
   }

   spinnerStart(): void {

    this.spinnerRequired(true);
    this.onloadingDefault();
    setTimeout(() => {
      if(this.isSpinnerRequired)
        this.onRequestStarted();
    }, this._spinnerTimeout);
  }

  spinnerStop() :  void {

    this.onRequestFinished();
    this.onloadingFinish();
    this.spinnerRequired(false);
  }
}
