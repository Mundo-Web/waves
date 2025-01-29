// Author: Manuel Gamboa

import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Adminto from './components/Adminto'
import CreateReactScript from './Utils/CreateReactScript'
import Modal from './components/Modal';
import InputFormGroup from './components/form/InputFormGroup';
import TextareaFormGroup from './components/form/TextareaFormGroup';
import googleSVG from './components/svg/google.svg'

const KPILeads = ({ sessions: sessionsDB = [] }) => {
  const modalRef = useRef();
  const [sessions, setSessions] = useState([null, ...sessionsDB])
  const [session, setSession] = useState({})

  const onModalOpen = (data) => {
    setSession(data)
    $(modalRef.current).modal('show')
  }

  return <>
    <main className='d-flex align-items-center justify-content-center' style={{ height: 'calc(100vh - 160px)' }}>
      {
        sessions.map((session, index) => {
          if (session == null) {
            return <div key={index} className="card btn btn-light waves-effect" onClick={() => onModalOpen(null)}>
              <div className="card-body widget-user">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1 overflow-hidden">
                    <i className='mdi mdi-plus mdi-36px'></i>
                    <span className='d-block'>Nuevo</span>
                  </div>
                </div>
              </div>
            </div>
          }
          return <div key={index} className="card">
            <div className="card-body widget-user">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1 overflow-hidden">
                  <h5 className="mt-0 mb-1">{session?.name}</h5>
                  <p className="text-muted mb-2 font-13 text-truncate">coderthemes@gmail.com</p>
                  <small className="text-pink"><b>Support Lead</b></small>
                </div>
              </div>
            </div>
          </div>
        })
      }
    </main>
    <Modal modalRef={modalRef} title={`Agregar cuenta${session?.type ? ` - ${session.type}` : ''}`} hideFooter={!(session?.type && !session?.name)}>
      {
        !session?.type &&
        <div className='d-flex align-items-center gap-3 justify-content-center' style={{
          minHeight: '240px'
        }}>

          {['Email', 'WhatsApp'].map((type, index) => {
            return <label key={index} className='d-block position-relative btn btn-light text-center' style={{
              width: '120px',
            }}>
              <input className='d-none position-absolute' type="radio" name="session_type" id="" value={type} style={{
                left: '8px',
                top: '8px'
              }} onChange={e => setSession(old => ({ ...old, type: e.target.value }))} />
              <img className='d-block mx-auto mb-1' src={`/assets/img/${type}.svg`} alt={type} style={{
                width: '50px',
                aspectRatio: 1,
                objectFit: 'contain',
                objectPosition: 'center'
              }} />
              <span>{type}</span>
            </label>
          })}
        </div>
      }
      {
        (session?.type && !session?.name) && <>
          {console.log(session)}
          <InputFormGroup label='Nombre' required />
          <TextareaFormGroup label='Descripcion' required />
          {
            session?.type == 'Email'
              ? <>
                <ul class="nav nav-pills navtab-bg nav-justified">
                  <li class="nav-item">
                    <a href="#email-integration" data-bs-toggle="tab" aria-expanded="false" class="nav-link active">
                      <i className='mdi mdi-email me-1'></i>
                      Integracion
                    </a>
                  </li>
                  <li class="nav-item">
                    <a href="#email-gmail" data-bs-toggle="tab" aria-expanded="true" class="nav-link">
                      <i className='mdi mdi-gmail me-1'></i>
                      Gmail
                    </a>
                  </li>
                  <li class="nav-item">
                    <a href="#email-google" data-bs-toggle="tab" aria-expanded="false" class="nav-link">
                      <i className='mdi mdi-google me-1'></i>
                      Google
                    </a>
                  </li>
                </ul>
                <div class="tab-content">
                  <div class="tab-pane active" id="email-integration">
                    <div className="row">
                      <InputFormGroup label='Host' col='col-md-8' />
                      <InputFormGroup label='Puerto' col='col-md-4' type='number' />
                      <InputFormGroup label='Correo' />
                      <InputFormGroup label='Contraseña' />
                    </div>
                  </div>
                  <div class="tab-pane show" id="email-gmail">
                    <InputFormGroup label='Correo' />
                    <InputFormGroup label='Contraseña de aplicación' />
                  </div>
                  <div class="tab-pane text-center" id="email-google">
                    <p>
                      Necesitamos tu permiso para <br />acceder a tu correo electrónico. <br />
                      <small className='text-muted'>No te preocupes, tus datos están seguros con nosotros.</small>
                    </p>
                    <div className='d-flex flex-column justify-content-center align-items-center gap-1'>
                      <button className='btn btn-sm btn-primary' type='button' onClick={() => setTokenUUID(crypto.randomUUID())}>
                        Ya he iniciado sesión
                      </button>
                      <button className="btn btn-sm btn-white d-inline-flex align-items-center gap-1" type='button' onClick={e => {
                        const authWindow = window.open(googleAuthURI, '_blank')
                        const lastTokenUUID = Local.get('tokenUUID')
                        const interval = setInterval(() => {
                          const newTokenUUID = Local.get('tokenUUID')
                          if (lastTokenUUID != newTokenUUID) {
                            clearInterval(interval)
                            authWindow.close();
                            setTokenUUID()
                          }
                        }, [500]);
                      }}>
                        <img src={googleSVG} alt="" style={{ width: '14px', height: '14px', objectFit: 'contain', objectPosition: 'center' }} />
                        <span>Permitir acceso</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
              : <>

              </>
          }
        </>

      }
    </Modal>
  </>
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Cuentas'>
      <KPILeads {...properties} />
    </Adminto>
  );
})