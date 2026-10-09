export interface DriverValues { nombre_completo:string; dni:string; licencia_categoria:string; anios_experiencia:number; telefono:string; usuario_id:string|null; estado:'ACTIVO'|'INACTIVO' }
export interface Driver extends DriverValues { conductor_id:string }
export interface DriverPage {items:Driver[];total:number;page:number;pageSize:number}
