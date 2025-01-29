import React from 'react'
import { createRoot } from 'react-dom/client'
import Adminto from './components/Adminto'
import CreateReactScript from './Utils/CreateReactScript'

const Home = ({ session }) => {

  return <main className='d-flex align-items-center justify-content-center' style={{ height: 'calc(100vh - 160px)' }}>
    <div className='text-center'>
      <h1>Hola {session.name?.split(' ')[0]} {session.lastname?.split(' ')[0]}</h1>
      <div className='d-flex justify-content-center gap-2'>
        <a href='/sessions' className='btn btn-light'>
          <i className='mdi mdi-vector-triangle me-1'></i>
          Ver cuentas
        </a>
        <a href='/templates' className='btn btn-light'>
          <i className='mdi mdi-page-layout-header-footer me-1'></i>
          Ver plantillas
        </a>
      </div>
    </div>
  </main>
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Inicio'>
      <Home {...properties} />
    </Adminto>
  );
})