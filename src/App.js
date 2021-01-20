import React, { useRef, useState } from 'react'
import './App.css';
import CanvasDraw from "react-canvas-draw";
import { jsPDF } from "jspdf";
import PdfExample from './MiFirma _ App.pdf'
import ElPdf from './pdf'
import combinePdfs from "combine-pdfs";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

import fs from 'fs'
function saveImage() {
  let sourceCanvas = document.getElementsByTagName("canvas")[1];
  let destinationCanvas = document.createElement("canvas");
  destinationCanvas.height = sourceCanvas.height;
  destinationCanvas.width = sourceCanvas.width;
  let destinationContext = destinationCanvas.getContext("2d");
  destinationContext.drawImage(sourceCanvas, 0, 0);
  destinationContext.globalCompositeOperation = "destination-over";
  destinationContext.fillStyle = "#f9f9f9";
  destinationContext.fillRect(0, 0, destinationCanvas.width, destinationCanvas.height);
  let image = destinationCanvas.toDataURL("image/png");
  return image;
}

function App() {
  const pad = useRef(null)
  const [img, setImg] = useState([])
  const [pdf, setPdf] = useState(null)
  const [pdf2, setPdf2] = useState(null)
  const [loading, setLoading] = useState(false)
  const [arrayBuffer, setArrayBuffer] = useState(false)


  const hue = async () => {
    if (loading) return;
    setLoading(true)
    let newImg = saveImage()
    let arr = img.map(i => i);
    arr.push(newImg)
    pad.current.clear();
    setImg(arr)
    const doc = new jsPDF();
    // doc.addImage(ElPdf, 'PNG', 10, 10, 50, 80)
    if (arr.length >= 1) doc.addImage(arr[0], 'png', 10, 10, 80, 80)
    if (arr.length >= 2) doc.addImage(arr[1], 'png', 100, 10, 80, 80)
    if (arr.length >= 3) doc.addImage(arr[2], 'png', 10, 100, 80, 80)
    if (arr.length >= 4) doc.addImage(arr[3], 'png', 100, 100, 80, 80)
    let base = doc.output('bloburi');
    // console.log({
    //   arraybuffer: doc.output('arraybuffer'),
    //   blob: doc.output('blob'),
    //   bloburi: doc.output('bloburi'),
    //   bloburl: doc.output('bloburl'),
    //   datauristring: doc.output('datauristring'),
    //   dataurlstring: doc.output('dataurlstring'),
    //   datauri: doc.output('datauri'),
    //   dataurl: doc.output('dataurl'),
    //   dataurlnewwindow: doc.output('dataurlnewwindow'),
    //   pdfobjectnewwindow: doc.output('pdfobjectnewwindow'),
    //   pdfjsnewwindow: doc.output('pdfjsnewwindow'),
    //   ElPdf
    // })
    doc.output('bloburi');
    setPdf2(base);
    // console.log(arr)

    setTimeout(() => {
      setLoading(false)
    }, 100)

    // const pdfDoc = await PDFDocument.create()
    const pdfDoc = await PDFDocument.load(ElPdf)
    const pngImage = await pdfDoc.embedPng(arr[0])
    const pngDims = pngImage.scale(0.5)
    const page = pdfDoc.addPage()
    page.drawImage(pngImage, {
      x: page.getWidth() / 2 - pngDims.width / 2 + 75,
      y: page.getHeight() / 2 - pngDims.height,
      width: pngDims.width,
      height: pngDims.height,
    })
    //data:application/pdf;filename=hue.pdf;base64,
    const pdfBytes = await pdfDoc.saveAsBase64()
    // console.log(pdfBytes)//: 'data:application/pdf;filename=hue.pdf;' + pdfBytes })
    setPdf('data:application/pdf;filename=hue.pdf;base64,' + pdfBytes);

  }
  // console.log(ElPdf)

  return (
    <div className="App">
      <div>
        <CanvasDraw
          ref={pad}
          loadTimeOffset={0}
          lazyRadius={1}
          brushRadius={1}
          brushColor={"#000"}
          catenaryColor={"#0a0302"}
          gridColor={"rgba(150,150,150,0.17)"}
          hideGrid={false}
          canvasWidth={400}
          canvasHeight={300}
          disabled={false}
          immediateLoading={true}
          hideInterface={false}
        />
        <button className="button" onClick={() => {
          pad.current.clear();
        }} >clear</button>
        <button className="button" onClick={() => {
          pad.current.clear();
          setPdf(null)
          setImg([])
        }} >eliminar</button>
        {!loading && <button className="button" onClick={() => {
          hue()
        }} >pdf</button>}
      </div>
      {pdf && !loading && <embed src={pdf} width='100%' height="600" />}
      {pdf2 && !loading && <embed src={pdf2} width='100%' height="600" />}
      {/* {img.map((item, index) => {
        return (
          <React.Fragment key={String(index) + 'imgs'} >
            <img src={item} />
          )
          </React.Fragment>)
      })} */}
    </div>
  );
}

export default App;
