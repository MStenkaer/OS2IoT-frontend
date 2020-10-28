import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-device-model-list',
  templateUrl: './device-model-list.component.html',
  styleUrls: ['./device-model-list.component.scss']
})
export class DeviceModelListComponent implements OnInit {

  constructor(
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
  }

}
