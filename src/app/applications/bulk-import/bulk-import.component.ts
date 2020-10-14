import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IoTDeviceService } from '@applications/iot-devices/iot-device.service';
import { faDownload, faTrash } from '@fortawesome/free-solid-svg-icons';
import { TranslateService } from '@ngx-translate/core';
import { ErrorMessageService } from '@shared/error-message.service';
import { Download } from '@shared/helpers/download.helper';
import { BackButton } from '@shared/models/back-button.model';
import { DownloadService } from '@shared/services/download.service';
import { Papa } from 'ngx-papaparse';
import { Observable } from 'rxjs';
import { BulkImport } from './bulk-import.model';
import { BulkMapping } from './bulkMapping';

@Component({
  selector: 'app-bulk-import',
  templateUrl: './bulk-import.component.html',
  styleUrls: ['./bulk-import.component.scss']
})
export class BulkImportComponent implements OnInit {
  displayedColumns: string[] = ['name', 'type', 'importStatus', 'errorMessages'];
  isLoading = false;
  bulkImport: BulkImport[];
  bulkImportResult: BulkImport[];
  fileFormatErrorMessage = false;
  files: any = [];
  faTrash = faTrash;
  faDownload = faDownload;
  samples = [
    { name: 'Generic Http sample', url: '../../../assets/docs/iotdevice_generichttp.csv' },
    { name: 'Lorawan sample', url: '../../../assets/docs/iotdevice_lorawan.csv' },
    { name: 'Sigfox sample', url: '../../../assets/docs/iotdevice_sigfox.csv' },
  ]
  download$: Observable<Download>;
  private bulkMapper = new BulkMapping();
  public backButton: BackButton = { label: '', routerLink: '/applications' };
  private applicationId;

  constructor(
    private papa: Papa,
    private iotDeviceService: IoTDeviceService,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private downloads: DownloadService,
    private errorMessageService: ErrorMessageService
  ) { }

  ngOnInit(): void {
    this.translate.use('da');
    this.translate.get(['NAV.APPLICATIONS'])
      .subscribe(translations => {
        this.backButton.label = translations['NAV.APPLICATIONS'];
      });
    this.applicationId = +this.route.snapshot.paramMap.get('id');

  }

  download({ name, url }: { name: string, url: string }) {
    this.download$ = this.downloads.download(url, name);
  }


  deleteAttachment(index) {
    this.files.splice(index, 1);
  }

  handleDropedFile(evt: any) {
    this.fileFormatErrorMessage = false;
    if (!this.validateFile(evt[0].name)) {
      console.log('Selected file format is not supported');
      this.fileFormatErrorMessage = true;
      return false;
    }
    this.bulkImport = [];
    this.bulkImportResult = [];
    for (let index = 0; index < evt.length; index++) {
      const element = evt[index];
      this.files.push(element.name);
    }
    // handle csv data
    this.isLoading = true;
    const files = evt;  // File List object
    const file = files[0];
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = (event: any) => {
      const csv = event.target.result; // Content of CSV file
      this.papa.parse(csv, {
        skipEmptyLines: true,
        header: true,
        complete: results => {
          this.mapData(results.data);
          // this step ensures material can read from the array - should be fixed.
          this.bulkImportResult = this.bulkImport;
          if (this.bulkImport?.length === 0) {
            alert('no data in csv');
          } else {
            return this.bulkImport;
          }
        }
      }
      );
      this.isLoading = false;
    };
  }

  private validateFile(name: string) {
    const ext = name.substring(name.lastIndexOf('.') + 1);
    if (ext.toLowerCase() === 'csv') {
      return true;
    } else {
      return false;
    }
  }

  private mapData(data: any[]) {
    data.forEach((device) => {
      const mappedDevice = this.bulkMapper.dataMapper(device, this.applicationId);
      if (mappedDevice) {
        this.bulkImport.push(new BulkImport(mappedDevice));
      } else {
        this.translate.get(['ERROR.SEMANTIC'])
          .subscribe(translations => {
            this.bulkImport.push(new BulkImport(null, [translations['ERROR.SEMANTIC']]));
      });
      }
    });
  }

  addIoTDevice() {
    this.bulkImportResult.forEach((requestItem) => {
      if (requestItem.device?.id) {
        this.iotDeviceService.updateIoTDevice(requestItem.device, requestItem.device.id).subscribe(
          (response) => {
            console.log(response);
            requestItem.importStatus = 'success';
          },
          (error: HttpErrorResponse) => {
            requestItem.errorMessages = this.errorMessageService.handleErrorMessage(error);
            requestItem.importStatus = 'Failed';
          }
        );
      } else if (requestItem.device) {
        this.iotDeviceService.createIoTDevice(requestItem.device).subscribe(
          (res: any) => {
            console.log(res);
            requestItem.importStatus = 'success';
          },
          (error) => {
            requestItem.errorMessages = this.errorMessageService.handleErrorMessage(error);
            requestItem.importStatus = 'Failed';
          }
        );
      }
    });
  }
}
