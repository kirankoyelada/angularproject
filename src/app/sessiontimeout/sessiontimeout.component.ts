import { Component,OnInit, AfterViewInit } from '@angular/core';
import * as $ from 'jquery';
import { Title } from '@angular/platform-browser';
import { MatDialog } from '@angular/material';
@Component({
  selector: 'app-session-timeout',
  templateUrl: './sessiontimeout.component.html'
})
export class SessionTimeOutComponent implements OnInit, AfterViewInit {

  constructor(
    private titleService: Title,
    private dialogRef: MatDialog
  ) {
      this.titleService.setTitle('BTCAT | Signout');
      localStorage.clear();
  }

  ngAfterViewInit() {
    $('.modal-backdrop').remove();
  }

  ngOnInit() {
    this.dialogRef.closeAll();
  }

}
