import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Application } from '@app/applications/application.model';
import { ApplicationService } from '@app/applications/application.service';
import { TranslateService } from '@ngx-translate/core';
import { DeviceProfile } from '@profiles/device-profiles/device-profile.model';
import { DeviceProfileService } from '@profiles/device-profiles/device-profile.service';
import { ServiceProfile, ServiceProfileResponseMany } from '@profiles/service-profiles/service-profile.model';
import { ServiceProfileService } from '@profiles/service-profiles/service-profile.service';
import { ActivationType } from '@shared/enums/activation-type';
import { DeviceType } from '@shared/enums/device-type';
import { ErrorMessageService } from '@shared/error-message.service';
import { ErrorMessage } from '@shared/models/error-message.model';
import { SharedVariableService } from '@shared/shared-variable/shared-variable.service';
import { Subscription } from 'rxjs';
import { IotDevice } from '../iot-device.model';
import { IoTDeviceService } from '../iot-device.service';


@Component({
    selector: 'app-iot-device-edit',
    templateUrl: './iot-device-edit.component.html',
    styleUrls: ['./iot-device-edit.component.scss'],
})
export class IotDeviceEditComponent implements OnInit, OnDestroy {
    public errorMessages: any;
    public errorFields: string[];
    public formFailedSubmit = false;
    public application: Application;
    private deviceId: number;
    public disableChoseApplication = true;
    public loraDevice = DeviceType.LORAWAN;
    public sigfoxDevice = DeviceType.SIGFOX;
    public serviceProfiles: ServiceProfile[];
    public deviceProfiles: DeviceProfile[];
    iotDevice = new IotDevice();
    editmode = false;
    public OTAA = true;

    public deviceSubscription: Subscription;
    private applicationsSubscription: Subscription;
    private serviceProfilesSubscription: Subscription;
    private deviceProfileSubscription: Subscription;
    private devicesProfileSubscription: Subscription;

    constructor(
        private route: ActivatedRoute,
        public translate: TranslateService,
        private router: Router,
        private serviceProfileService: ServiceProfileService,
        private deviceProfileService: DeviceProfileService,
        private applicationService: ApplicationService,
        private iotDeviceService: IoTDeviceService,
        private location: Location,
        private shareVariable: SharedVariableService,
        private errorMessageService: ErrorMessageService
    ) { }

    ngOnInit(): void {
        this.translate.use('da');
        this.iotDevice.applicationId = +this.route.snapshot.paramMap.get('id');
        this.deviceId = +this.route.snapshot.paramMap.get('deviceId');

        if (this.iotDevice.applicationId && this.deviceId) {
            this.editmode = true;
            this.getDevice(this.deviceId);
            this.disableChoseApplication = false;
        }

        this.getApplication();
        this.getServiceProfiles();
        this.getDeviceProfiles();
    }

    getApplication(): void {
        this.applicationsSubscription = this.applicationService
            .getApplication(this.iotDevice.applicationId)
            .subscribe((application: Application) => {
                this.application = application;
            });
    }

    getDevice(id: number): void {
        this.deviceSubscription = this.iotDeviceService
            .getIoTDevice(id)
            .subscribe((device: IotDevice) => {
                this.iotDevice = device;
                if (this.iotDevice?.application?.id) {
                    this.iotDevice.applicationId = device.application?.id;
                }
                if (device.location) {
                    this.iotDevice.longitude = device.location.coordinates[0];
                    this.iotDevice.latitude = device.location.coordinates[1];
                }
                this.OTAA = this.iotDevice.lorawanSettings?.OTAAapplicationKey ? true : false;
                if (device.sigfoxSettings) {
                }
            });
    }

    onChangeDeviceProfile(deviceProfileId: string) {
        this.getDeviceProfile(deviceProfileId);
    }

    getDeviceProfile(deviceProfileId: string) {
        this.deviceProfileSubscription = this.deviceProfileService.getOne(deviceProfileId)
            .subscribe((response) => {
                this.OTAA = response.deviceProfile.supportsJoin;
            });
    }

    getServiceProfiles() {
        this.serviceProfilesSubscription = this.serviceProfileService
            .getMultiple().subscribe((result: ServiceProfileResponseMany) => {
                this.serviceProfiles = result.result;
            });
    }

    getDeviceProfiles() {
        this.devicesProfileSubscription = this.deviceProfileService
            .getMultiple().subscribe((result) => {
                this.deviceProfiles = result.result;
            });
    }

    onSubmit(): void {
        this.adjustModelBasedOnType();
        if (this.deviceId !== 0) {
            this.updateIoTDevice(this.deviceId);
        } else {
            this.postIoTDevice();
        }
    }

    setActivationType() {
        if (this.OTAA) {
            this.iotDevice.lorawanSettings.activationType = ActivationType.OTAA;
        } else {
            this.iotDevice.lorawanSettings.activationType = ActivationType.ABP;
        }
    }

    private adjustModelBasedOnType() {
        switch (this.iotDevice.type) {
            case DeviceType.GENERICHTTP: {
                this.iotDevice.lorawanSettings = undefined;
                this.iotDevice.sigfoxSettings = undefined;
                break;
            }
            case DeviceType.LORAWAN: {
                this.setActivationType();
                this.iotDevice.sigfoxSettings = undefined;
                if (this.iotDevice.lorawanSettings.devEUI) {
                    this.iotDevice.lorawanSettings.devEUI = this.iotDevice.lorawanSettings.devEUI.toLowerCase();
                }
                break;
            }
            case DeviceType.SIGFOX: {
                this.iotDevice.lorawanSettings = undefined;
                if (this.iotDevice.sigfoxSettings.endProductCertificate) {
                    this.iotDevice.sigfoxSettings.prototype = false;
                }
                break;
            }
        }
    }

    postIoTDevice() {
        this.iotDeviceService.createIoTDevice(this.iotDevice).subscribe(
            () => {
                this.router.navigate([
                    'applications/',
                    this.iotDevice.applicationId,
                ]);
            },
            (error: HttpErrorResponse) => {
                this.handleError(error);
                this.formFailedSubmit = true;
            }
        );
    }

    updateIoTDevice(id: number) {
        this.iotDevice.applicationId = Number(this.iotDevice.applicationId);
        this.iotDeviceService.updateIoTDevice(this.iotDevice, id).subscribe(
            () => {
                this.routeBack();
            },
            (error: HttpErrorResponse) => {
                this.handleError(error);
                this.formFailedSubmit = true;
            }
        );
    }

    routeBack(): void {
        this.location.back();
    }

    handleError(error: HttpErrorResponse) {
        const errorMessage: ErrorMessage = this.errorMessageService.handleErrorMessageWithFields(error);
        this.errorFields = errorMessage.errorFields;
        this.errorMessages = errorMessage.errorMessages;
    }

    onCoordinateKey(event: any) {
        console.log(event.target.value);
        console.log(event.target.maxLength);
        if (event.target.value.length > event.target.maxLength) {
            event.target.value = event.target.value.slice(
                0,
                event.target.maxLength
            );
        }
    }

    ngOnDestroy() {
        // prevent memory leak by unsubscribing
        if (this.applicationsSubscription) {
            this.applicationsSubscription.unsubscribe();
        }
        if (this.deviceSubscription) {
            this.deviceSubscription.unsubscribe();
        }
        if (this.deviceProfileSubscription) {
            this.deviceProfileSubscription.unsubscribe();
        }
        if (this.devicesProfileSubscription) {
            this.devicesProfileSubscription.unsubscribe();
        }
        if (this.serviceProfilesSubscription) {
            this.serviceProfilesSubscription.unsubscribe();
        }
    }
}
