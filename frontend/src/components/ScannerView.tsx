import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, DragEvent } from "react"
import { Camera, CameraOff, ImagePlus, Leaf, LoaderCircle, MapPin } from "lucide-react"

export const ScannerView = ({ onScan, isScanning, error }: {
  onScan: (file: File) => Promise<void>
  isScanning: boolean
  error: string
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [preview, setPreview] = useState("")

  useEffect(() => {
    if (!cameraOpen) return
    let stream: MediaStream | undefined
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
        if (videoRef.current) videoRef.current.srcObject = stream
        setCameraError("")
      } catch {
        setCameraError("Camera access was unavailable. Check your browser permission or use a photo instead.")
        setCameraOpen(false)
      }
    }
    void startCamera()
    return () => stream?.getTracks().forEach((track) => track.stop())
  }, [cameraOpen])

  const chooseFile = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return
    setPreview(URL.createObjectURL(file))
    void onScan(file)
  }

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => chooseFile(event.target.files?.[0])
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    chooseFile(event.dataTransfer.files[0])
  }

  const captureFrame = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) return
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) return
      setCameraOpen(false)
      chooseFile(new File([blob], `zoidex-${Date.now()}.jpg`, { type: "image/jpeg" }))
    }, "image/jpeg", 0.9)
  }

  return (
    <main className="page scanner-page">
      <div className="eyebrow"><Leaf size={15} /> ZOIDEX / SCAN</div>
      <div className="scanner-heading">
        <div><h1>Find something alive.</h1><p>Look closely, take a picture, and keep a record of what you find outdoors.</p></div>
        <div className="location"><MapPin size={15} /> <span>Location ready</span></div>
      </div>
      <div className={`drop-zone ${preview ? "has-preview" : ""} ${cameraOpen ? "camera-active" : ""} ${isScanning ? "scanning" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
        {cameraOpen ? <video ref={videoRef} className="camera-preview" autoPlay muted playsInline /> : preview ? <img src={preview} alt="Selected specimen" /> : <div className="drop-empty"><div className="camera-circle"><Camera size={30} /></div><strong>Bring a specimen into focus</strong><span>Use your camera or choose a photo</span></div>}
        {isScanning && <div className="scan-overlay"><LoaderCircle className="spin" size={30} /><strong>Looking closer...</strong><span>Preparing your observation</span></div>}
        {cameraOpen && !isScanning && <div className="camera-controls"><button className="capture-button" onClick={captureFrame} aria-label="Capture specimen"><Camera size={22} /></button><button className="camera-cancel" onClick={() => setCameraOpen(false)} aria-label="Close camera"><CameraOff size={18} /></button></div>}
      </div>
      <div className="scanner-actions">
        <button className="button button-primary" onClick={() => setCameraOpen(true)} disabled={isScanning || cameraOpen}><Camera size={18} /> Open camera</button>
        <button className="button button-quiet" onClick={() => inputRef.current?.click()} disabled={isScanning || cameraOpen}><ImagePlus size={18} /> {preview ? "Choose another photo" : "Use a photo"}</button>
        <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} hidden />
      </div>
      {(error || cameraError) && <p className="error-message">{error || cameraError}</p>}
      <div className="scanner-note"><span>01</span><p>Every entry is a small act of attention. Save what you find and build a record of your days outside.</p></div>
    </main>
  )
}