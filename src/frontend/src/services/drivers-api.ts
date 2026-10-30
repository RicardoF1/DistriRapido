import {request} from './api';
import type {Driver,DriverPage,DriverValues,DriverAccountPage} from '../types/drivers';
export const driversApi={
 list:(page=1,search='',estado='',signal?:AbortSignal)=>request<DriverPage>('/drivers?'+new URLSearchParams({page:String(page),pageSize:'20',...(search?{search}:{}),...(estado?{estado}:{})}),{signal}),
 get:(id:string,signal?:AbortSignal)=>request<Driver>('/drivers/'+id,{signal}),
 create:(values:DriverValues)=>request<Driver>('/drivers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)}),
 update:(id:string,values:Partial<DriverValues>)=>request<Driver>('/drivers/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)}),
};
export const driverAccountsApi = {
 options: (id: string, search = '', page = 1, signal?: AbortSignal) => request<DriverAccountPage>('/drivers/account-options?' + new URLSearchParams({ conductor_id: id, search, page: String(page), pageSize: '20' }), { signal }),
 link: (id: string, values: { usuario_id: string; expected_usuario_id: string | null; confirm_replacement: boolean }) => request<Driver>('/drivers/' + id + '/account', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }),
 create: (id: string, values: { email: string; password: string }) => request<Driver>('/drivers/' + id + '/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }),
};
