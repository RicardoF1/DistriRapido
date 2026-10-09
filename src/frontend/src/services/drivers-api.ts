import {request} from './api';
import type {Driver,DriverPage,DriverValues} from '../types/drivers';
export const driversApi={
 list:(page=1,search='',estado='',signal?:AbortSignal)=>request<DriverPage>('/drivers?'+new URLSearchParams({page:String(page),pageSize:'20',...(search?{search}:{}),...(estado?{estado}:{})}),{signal}),
 get:(id:string,signal?:AbortSignal)=>request<Driver>('/drivers/'+id,{signal}),
 create:(values:DriverValues)=>request<Driver>('/drivers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)}),
 update:(id:string,values:Partial<DriverValues>)=>request<Driver>('/drivers/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)}),
};
