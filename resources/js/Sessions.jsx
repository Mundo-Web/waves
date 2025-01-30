// Author: Manuel Gamboa

import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Adminto from './components/Adminto'
import CreateReactScript from './Utils/CreateReactScript'
import Modal from './components/Modal';
import InputFormGroup from './components/form/InputFormGroup';
import TextareaFormGroup from './components/form/TextareaFormGroup';
import googleSVG from './components/svg/google.svg'
import SessionsRest from './actions/SessionsRest';
import Tippy from '@tippyjs/react';
import SessionCard from './Reutilizables/Sessions/SessionCard';

const sessionsRest = new SessionsRest()

const KPILeads = ({ sessions: sessionsDB = [] }) => {

  const modalRef = useRef()
  const pingModalRef = useRef()

  const sessionNameRef = useRef()
  const sessionIdRef = useRef()
  const sessionEmailFromRef = useRef()
  const sessionEmailToRef = useRef()
  const sessionWhatsAppFromRef = useRef()
  const sessionWhatsAppToRef = useRef()

  const idRef = useRef()
  const nameRef = useRef()
  const aliasRef = useRef()
  const descriptionRef = useRef()

  // Metadata Integration
  const intHostRef = useRef()
  const intPortRef = useRef()
  const intEmailRef = useRef()
  const intPasswordRef = useRef()

  // Metadata Gmail
  const gmailEmailRef = useRef()
  const gmailPasswordRef = useRef()

  const [sessions, setSessions] = useState(sessionsDB)
  const [accountType, setAccountType] = useState(null)
  const [emailType, setEmailType] = useState(null)

  const onModalOpen = (data) => {
    setAccountType(data?.type ?? null)

    idRef.current.value = data?.id ?? ''
    nameRef.current.value = data?.name ?? ''
    aliasRef.current.value = data?.alias ?? ''
    descriptionRef.current.value = data?.description ?? ''

    // Limpiando datos
    setEmailType(data?.metadata?.type ?? 'integration')
    gmailEmailRef.current.value = ''
    gmailPasswordRef.current.value = ''
    intHostRef.current.value = ''
    intPortRef.current.value = ''
    intEmailRef.current.value = ''
    intPasswordRef.current.value = ''

    switch (data?.metadata?.type) {
      case 'gmail':
        gmailEmailRef.current.value = data?.metadata?.email ?? ''
        gmailPasswordRef.current.value = data?.metadata?.password ?? ''
        break;
      case 'google':
        break;
      default:
        intHostRef.current.value = data?.metadata?.host ?? ''
        intPortRef.current.value = data?.metadata?.port ?? ''
        intEmailRef.current.value = data?.metadata?.email ?? ''
        intPasswordRef.current.value = data?.metadata?.password ?? ''
        break;
    }

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      type: accountType,
      name: nameRef.current.value,
      alias: aliasRef.current.value,
      description: descriptionRef.current.value,
      metadata: {
        type: emailType
      }
    }


    switch (emailType) {
      case 'gmail':
        request.metadata.email = gmailEmailRef.current.value
        request.metadata.password = gmailPasswordRef.current.value
        break;
      case 'google':

        break;
      default:
        request.metadata.host = intHostRef.current.value
        request.metadata.port = intPortRef.current.value
        request.metadata.email = intEmailRef.current.value
        request.metadata.password = intPasswordRef.current.value
        break;
    }

    const result = await sessionsRest.save(request)
    if (!result) return

    setSessions(old => ([...old, result]))
    $(modalRef.current).modal('hide')
  }

  const onPingModalOpen = (data) => {
    setAccountType(data.type)
    sessionNameRef.current.textContent = data.name

    if (data.type == 'Email') {
      sessionEmailFromRef.current.value = data.metadata.email
      sessionEmailToRef.current.value = ''
    } else {
      sessionWhatsAppFromRef.current.value = data.metadata.phone
      sessionWhatsAppToRef.current.value = ''
    }

    $(pingModalRef.current).modal('show')
  }

  const onPingSubmit = async (e) => {
    e.preventDefault()
    const request = {
      from: sessionIdRef.current.value,
      to: accountType == 'Email'
        ? sessionEmailToRef.current.value
        : sessionWhatsAppToRef.current.value
    }

    await sessionsRest.ping(request)
  }

  return <>
    <main className='d-flex align-items-center justify-content-center gap-2' style={{ height: 'calc(100vh - 160px)' }}>
      <div className="card btn btn-light waves-effect" onClick={() => onModalOpen()}>
        <div className="card-body widget-user">
          <div className="d-flex align-items-center">
            <div className="flex-grow-1 overflow-hidden">
              <i className='mdi mdi-plus mdi-24px'></i>
              <span className='d-block'>Nueva cuenta</span>
            </div>
          </div>
        </div>
      </div>
      {
        sessions.map((session, index) => <SessionCard key={index} onModalOpen={onModalOpen} onPingModalOpen={onPingModalOpen} {...session} />)
      }
    </main>
    <Modal modalRef={modalRef} title={`Agregar cuenta${accountType ? ` - ${accountType}` : ''}`} hideFooter={!accountType} onSubmit={onModalSubmit}>
      <input ref={idRef} type="hidden" />

      <div className={`${!accountType ? 'd-flex' : 'd-none'} align-items-center gap-3 justify-content-center`} style={{
        minHeight: '240px'
      }} >

        {['Email', 'WhatsApp'].map((type, index) => {
          return <label key={index} className='d-block position-relative btn btn-light text-center' style={{
            width: '120px',
          }}>
            <input className='d-none position-absolute' type="radio" name="session_type" id="" value={type} style={{
              left: '8px',
              top: '8px'
            }} onChange={e => setAccountType(e.target.value)} />
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

      <div hidden={!accountType}>
        <div className="row">
          <InputFormGroup eRef={nameRef} label='Nombre' col='col-md-8' required />
          <InputFormGroup eRef={aliasRef} label='Alias' col='col-md-4' />
          <TextareaFormGroup eRef={descriptionRef} label='Descripcion' required />
        </div>
        <div hidden={accountType != 'Email'}>
          <ul id='email-types' className="nav nav-pills navtab-bg nav-justified">
            <li className="nav-item">
              <a href="#email-integration" data-bs-toggle="tab" aria-expanded="false" className={`nav-link ${emailType == null || emailType == 'integration' ? 'active' : ''}`} >
                <i className='mdi mdi-email me-1'></i>
                Integracion
              </a>
            </li>
            <li className="nav-item">
              <a href="#email-gmail" data-bs-toggle="tab" aria-expanded="true" className={`nav-link ${emailType == 'gmail' ? 'active' : ''}`}>
                <i className='mdi mdi-gmail me-1'></i>
                Gmail
              </a>
            </li>
            <Tippy content="Proximamente">
              <li className="nav-item">
                <a href="#email-google" data-bs-toggle="tab" aria-expanded="false" className={`nav-link ${emailType == 'google' ? 'active' : ''} disabled`} >
                  <i className='mdi mdi-google me-1'></i>
                  Google
                </a>
              </li>
            </Tippy>
          </ul>
          <div className="tab-content">
            <div className={`tab-pane ${emailType == 'integration' ? 'active' : ''}`} id="email-integration">
              <div className="row">
                <InputFormGroup eRef={intHostRef} label='Host' col='col-md-8' />
                <InputFormGroup eRef={intPortRef} label='Puerto' col='col-md-4' type='number' />
                <InputFormGroup eRef={intEmailRef} label='Correo' />
                <InputFormGroup eRef={intPasswordRef} label='Contraseña' />
              </div>
            </div>
            <div className={`tab-pane ${emailType == 'gmail' ? 'active' : ''}`} id="email-gmail">
              <blockquote>Para obtener una contraseña de aplicación de Gmail acceda a este enlace: <a href="//myaccount.google.com/apppasswords" target='_blank'>myaccount.google.com/apppasswords</a></blockquote>
              <InputFormGroup eRef={gmailEmailRef} label='Correo' />
              <InputFormGroup eRef={gmailPasswordRef} label='Contraseña de aplicación' />
            </div>
            <div className={`tab-pane text-center ${emailType == 'google' ? 'active' : ''}`} id="email-google">
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
        </div>

      </div>
    </Modal>

    <Modal modalRef={pingModalRef} title='Ping' size='sm' onSubmit={onPingSubmit}>
      <input ref={sessionIdRef} type="hidden" />
      <blockquote>Envia un mensaje de prueba con <b ref={sessionNameRef}>sodeword@gmail.com</b></blockquote>
      <div hidden={accountType != 'Email'}>
        <InputFormGroup eRef={sessionEmailFromRef} label='De:' disabled />
        <InputFormGroup eRef={sessionEmailToRef} label='Para:' type='email' />
      </div>
      <div hidden={accountType != 'WhatsApp'}>
        <InputFormGroup eRef={sessionWhatsAppFromRef} label='De:' type='tel' />
        <InputFormGroup eRef={sessionWhatsAppToRef} label='Para:' type='tel' />
      </div>
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