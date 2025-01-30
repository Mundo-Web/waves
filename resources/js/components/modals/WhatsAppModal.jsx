import React, { useEffect, useRef, useState } from "react";
import WhatsAppStatuses from "../../Reutilizables/WhatsApp/WhatsAppStatuses";
import '../../../css/qr-code.css'
import Swal from "sweetalert2";
import Tippy from "@tippyjs/react";
import { Notify } from "sode-extend-react";
import Global from "../../Utils/Global";

const WhatsAppModal = ({ modalRef, dataLoaded, onReady }) => {
  const qrRef = useRef()
  const phoneRef = useRef()

  const [status, setStatus] = useState('verifying')
  const { color, icon, text } = WhatsAppStatuses[status]
  const [percent, setPercent] = useState(0)
  const [sessionInfo, setSessionInfo] = useState({})

  const businessSession = `${Global.APP_CORRELATIVE}-${dataLoaded?.id}`

  useEffect(() => {
    if (!dataLoaded) return
    if (status == 'verifying') {
      const searchParams = new URLSearchParams({
        session: businessSession
      })

      let eventSource = new EventSource(`${Global.WA_URL}/api/session/verify?${searchParams}`)
      eventSource.onmessage = ({ data }) => {
        if (data == 'ping') return console.log('Realtime active')
        const { status, qr, percent, info } = JSON.parse(data)
        switch (status) {
          case 'qr':
            setStatus('qr')
            $(qrRef.current).empty()
            new QRCode(qrRef.current, {
              text: qr,
              width: 200,
              height: 200,
              colorDark: '#343a40'
            });
            break;
          case 'loading_screen':
            setStatus('loading_screen')
            setPercent(percent)
            break
          case 'authenticated':
            setStatus('authenticated')
            break
          case 'ready':
            setStatus('ready')
            setSessionInfo(info)
            onReady({
              id: dataLoaded.id,
              metadata: {
                name: info.pushname,
                email: info.me._serialized,
                phone: info.me.user
              }
            })
            eventSource.close()
            break
          case 'close':
            setStatus('close')
            eventSource.close()
            setTimeout(() => {
              setStatus('verifying')
            }, 5000)
            break
          default:
            eventSource.close()
            break;
        }
      }
      eventSource.onerror = event => {
        console.log('Realtime closed')
        setStatus('close')
        eventSource.close()
        setTimeout(() => {
          setStatus('verifying')
        }, 5000)
      }
    }
  }, [status, dataLoaded])

  const onCloseClicked = async () => {
    const { isConfirmed } = await Swal.fire({
      title: "Estas seguro?",
      text: `Se cerrara la sesion actual`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: `Cancelar`
    })
    if (!isConfirmed) return
    await fetch(`${Global.WA_URL}/api/session/${businessSession}`, {
      method: 'DELETE'
    })
    Notify.add({
      icon: '/assets/img/logo-login.svg',
      title: 'Operacion correcta',
      body: `Se cerro la sesion de ${sessionInfo?.pushname || 'WhatsApp'}`
    })
    setSessionInfo({})
    setStatus('verifying')
  }

  return (<div ref={modalRef} className="modal fade" aria-hidden="true" data-bs-backdrop='static' >
    <div className="modal-dialog modal-sm modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-body">
          <div className="text-center">
            <button type='button' className='btn-close position-absolute top-0 end-0 me-2 mt-2' data-bs-dismiss='modal' aria-label='Close'></button>
            <i className={`${icon} h1 text-${color} my-2 d-block`}></i>
            <h4 className="mt-2">{text} {status == 'loading_screen' && `[${percent}%]`}</h4>
            <div ref={qrRef} id="qr-code" className={`mt-3 text-center ${status == 'qr' ? 'd-block' : 'd-none'}`}>
            </div>
            {
              status == 'ready' && <div className="d-block py-2">
                <b>{sessionInfo?.pushname}</b>
                <br />
                <span className="text-muted">{sessionInfo?.me?.user}@{sessionInfo?.me?.server}</span>
              </div>
            }
            {status == 'ready' && <button type="button" className="btn btn-danger my-2" onClick={onCloseClicked}>Cerrar sesion</button>}
          </div>
        </div>
      </div>
    </div>
  </div>)
}

export default WhatsAppModal;