import {Outlet} from 'react-router-dom';
import {AppLayout} from './AppLayout';
export function DriversLayout(){return <AppLayout title="Conductores" navigationLabel="Gestión de conductores"><Outlet/></AppLayout>;}
