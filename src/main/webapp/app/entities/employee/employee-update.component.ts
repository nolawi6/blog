import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import * as moment from 'moment';
import { DATE_TIME_FORMAT } from 'app/shared/constants/input.constants';
import { JhiAlertService } from 'ng-jhipster';
import { IEmployee } from 'app/shared/model/employee.model';
import { EmployeeService } from './employee.service';
import { IDepartment } from 'app/shared/model/department.model';
import { DepartmentService } from 'app/entities/department';
import { IAddress } from 'app/shared/model/address.model';
import { AddressService } from 'app/entities/address';

@Component({
    selector: 'jhi-employee-update',
    templateUrl: './employee-update.component.html'
})
export class EmployeeUpdateComponent implements OnInit {
    employee: IEmployee;
    isSaving: boolean;

    departments: IDepartment[];

    employeehasaddresses: IAddress[];

    employees: IEmployee[];
    hireDate: string;

    constructor(
        protected jhiAlertService: JhiAlertService,
        protected employeeService: EmployeeService,
        protected departmentService: DepartmentService,
        protected addressService: AddressService,
        protected activatedRoute: ActivatedRoute
    ) {}

    ngOnInit() {
        this.isSaving = false;
        this.activatedRoute.data.subscribe(({ employee }) => {
            this.employee = employee;
            this.hireDate = this.employee.hireDate != null ? this.employee.hireDate.format(DATE_TIME_FORMAT) : null;
        });
        this.departmentService
            .query()
            .pipe(
                filter((mayBeOk: HttpResponse<IDepartment[]>) => mayBeOk.ok),
                map((response: HttpResponse<IDepartment[]>) => response.body)
            )
            .subscribe((res: IDepartment[]) => (this.departments = res), (res: HttpErrorResponse) => this.onError(res.message));
        this.addressService
            .query({ filter: 'employee-is-null' })
            .pipe(
                filter((mayBeOk: HttpResponse<IAddress[]>) => mayBeOk.ok),
                map((response: HttpResponse<IAddress[]>) => response.body)
            )
            .subscribe(
                (res: IAddress[]) => {
                    if (!this.employee.employeeHasAddress || !this.employee.employeeHasAddress.id) {
                        this.employeehasaddresses = res;
                    } else {
                        this.addressService
                            .find(this.employee.employeeHasAddress.id)
                            .pipe(
                                filter((subResMayBeOk: HttpResponse<IAddress>) => subResMayBeOk.ok),
                                map((subResponse: HttpResponse<IAddress>) => subResponse.body)
                            )
                            .subscribe(
                                (subRes: IAddress) => (this.employeehasaddresses = [subRes].concat(res)),
                                (subRes: HttpErrorResponse) => this.onError(subRes.message)
                            );
                    }
                },
                (res: HttpErrorResponse) => this.onError(res.message)
            );
        this.employeeService
            .query()
            .pipe(
                filter((mayBeOk: HttpResponse<IEmployee[]>) => mayBeOk.ok),
                map((response: HttpResponse<IEmployee[]>) => response.body)
            )
            .subscribe((res: IEmployee[]) => (this.employees = res), (res: HttpErrorResponse) => this.onError(res.message));
    }

    previousState() {
        window.history.back();
    }

    save() {
        this.isSaving = true;
        this.employee.hireDate = this.hireDate != null ? moment(this.hireDate, DATE_TIME_FORMAT) : null;
        if (this.employee.id !== undefined) {
            this.subscribeToSaveResponse(this.employeeService.update(this.employee));
        } else {
            this.subscribeToSaveResponse(this.employeeService.create(this.employee));
        }
    }

    protected subscribeToSaveResponse(result: Observable<HttpResponse<IEmployee>>) {
        result.subscribe((res: HttpResponse<IEmployee>) => this.onSaveSuccess(), (res: HttpErrorResponse) => this.onSaveError());
    }

    protected onSaveSuccess() {
        this.isSaving = false;
        this.previousState();
    }

    protected onSaveError() {
        this.isSaving = false;
    }

    protected onError(errorMessage: string) {
        this.jhiAlertService.error(errorMessage, null, null);
    }

    trackDepartmentById(index: number, item: IDepartment) {
        return item.id;
    }

    trackAddressById(index: number, item: IAddress) {
        return item.id;
    }

    trackEmployeeById(index: number, item: IEmployee) {
        return item.id;
    }
}
