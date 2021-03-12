import React, { useRef, useState, useEffect } from 'react'
import './App.css';
import CanvasDraw from "react-canvas-draw";
import reconocimiento from './reconocimiento.pdf'
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument, rgb } from 'pdf-lib';
import p5 from 'p5'
function saveSignatureImage() {
  let sourceCanvas = document.getElementsByClassName("signaturepad")[0].getElementsByTagName("canvas")[1]
  let destinationCanvas = document.createElement("canvas");
  destinationCanvas.height = sourceCanvas.height;
  destinationCanvas.width = sourceCanvas.width;
  let destinationContext = destinationCanvas.getContext("2d");
  destinationContext.drawImage(sourceCanvas, 0, 0);
  destinationContext.globalCompositeOperation = "destination-over";
  destinationContext.fillStyle = "#4484a500";
  destinationContext.fillRect(0, 0, destinationCanvas.width, destinationCanvas.height);
  let image = destinationCanvas.toDataURL("image/png");
  return image;
}

function P5Contianer({ pageNumber, widthImg, heightImg, base64Img, imgSignature, widthImgSignature, heightImgSignature, save }) {
  const p5Ref = useRef()
  const [p5Canvas, setp5Canvas] = useState(null)
  const Sketch = (sketch) => {
    let scaleSlider;
    let page = null;
    let signature = null;
    let xSignature = 0;
    let ySignature = 0;
    let overImage = false;
    let done = false;
    let locked = false;
    let xOffSet = 0;
    let yOffSet = 0;
    let button;
    let params = {}
    sketch.preload = () => {
      page = sketch.loadImage(base64Img)
      signature = sketch.loadImage(imgSignature)
    };
    sketch.setup = () => {
      sketch.createCanvas(widthImg, heightImg);
      sketch.textSize(15);
      sketch.noStroke();
      scaleSlider = sketch.createSlider(0, 200, 100);
      scaleSlider.position(20, 50);
      sketch.textSize(15);
      sketch.noStroke();
      button = sketch.createButton("guardar");
      button.mouseClicked(() => {
        save(params)
      });
      button.size(200, 50);
      button.position(20, 100);

    };
    sketch.draw = () => {
      let scale = scaleSlider.value();
      sketch.background(220);
      sketch.fill(255);
      sketch.image(page, 0, 0, widthImg, heightImg);
      let xPosition = sketch.mouseX;
      let yPosition = sketch.mouseY;
      if (xPosition >= xSignature && xPosition <= xSignature + widthImgSignature && yPosition >= ySignature && yPosition <= ySignature + heightImgSignature) {
        let isCurrent = false;
        isCurrent = overImage || isCurrent;
        if (!isCurrent && !done) overImage = true;
      } else overImage = false;
      sketch.image(signature, xSignature, ySignature, widthImgSignature * (scale / 100), heightImgSignature * (scale / 100));
      params = {
        x: xSignature,
        y: ySignature,
        width: widthImgSignature * (scaleSlider.value() / 100),
        height: heightImgSignature * (scaleSlider.value() / 100),
        pageNumber,
        widthImg,
        heightImg,
      }
    };

    sketch.mousePressed = () => {
      if (overImage) {
        locked = true;
      } else {
        locked = false;
      }
      xOffSet = sketch.mouseX - xSignature;
      yOffSet = sketch.mouseY - ySignature;
    }

    sketch.mouseDragged = () => {
      if (locked) {
        xSignature = sketch.mouseX - Math.floor(xOffSet);
        ySignature = sketch.mouseY - Math.floor(yOffSet);
      }
    }

    sketch.mouseReleased = () => {
      locked = false;
    };
  }
  useEffect(() => {
    setp5Canvas(new p5(Sketch, p5Ref.current))
  }, [])


  return (
    <div ref={p5Ref} />
  )

}




function App() {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const pad = useRef(null)
  const [imgSignature, setImgSignature] = useState(null)
  const [showPdf, setShowPdf] = useState(false)
  const [pagesSize, setPagesSize] = useState([])
  const [pagesImgs, setPagesImgs] = useState([])
  const [widthImgSignature, setWidthImgSignature] = useState(400)
  const [heightImgSignature, setHeightImgSignature] = useState(300)
  const [pdfFileData, setPdfFileData] = useState(null)
  const [pdf, setPdf] = useState(null)

  const getPdgPageSize = async () => {
    const existingPdfBytes = await fetch(reconocimiento).then(res => res.arrayBuffer())
    const pdfDoc = await PDFDocument.load(existingPdfBytes)
    const pages = pdfDoc.getPages()
    let sizes = pages.map(i => i.getSize())

    setPagesSize(sizes)
  }

  const createDocument = async () => {
    const existingPdfBytes = await fetch(reconocimiento).then(res => res.arrayBuffer())
    const pdfDoc = await PDFDocument.load(existingPdfBytes)
    const pngImage = await pdfDoc.embedPng(imgSignature)
    const pages = pdfDoc.getPages()
    const selectPage = pages[pdfFileData.pageNumber]
    const { height, width } = selectPage.getSize()

    let hue = {
      x: pdfFileData.x,
      y: height - pdfFileData.y - pdfFileData.height,
      width: pdfFileData.width,
      height: pdfFileData.height,
    }

    selectPage.drawImage(pngImage, hue)

    for (let i = 0; i < 20; i++) {
      selectPage.drawCircle({
        x: 20,
        y: 20 + (i * 50),
        size: 10,
        color: rgb(1, 0, 0),
      })
    }

    for (let i = 0; i < 20; i++) {
      selectPage.drawCircle({
        y: 20,
        x: 20 + (i * 50),
        size: 10,
        color: rgb(1, 0, 0),
      })
    }

    const pdfBytes = await pdfDoc.saveAsBase64()
    let elnuevopdf = 'data:application/pdf;filename=hue.pdf;base64,' + pdfBytes
    setPdf(elnuevopdf);
  }

  useEffect(() => {
    if (pdfFileData) {
      createDocument()
    }
  }, [pdfFileData])


  useEffect(() => {
    getPdgPageSize()
  }, [])

  const saveSignature = () => setImgSignature(saveSignatureImage())

  const onDocumentLoadSuccess = (params) => {
    let { numPages } = params
    setNumPages(numPages);
    setPageNumber(1);
  }


  const changePage = (offset) => {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  }

  const previousPage = () => {
    changePage(-1);
  }

  const nextPage = () => {
    changePage(1);
  }

  return (
    <div className="App">
      {showPdf && (
        <>
          <div>
            <div style={{ padding: '16px' }}>
              {pdf && <embed src={pdf} width='100%' height="600" />}
            </div>
            <div>
              <div className="pagec">
                Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
              </div>
              <div className="buttonc">
                <button
                  className="button Pre"
                  type="button"
                  disabled={pageNumber <= 1}
                  onClick={previousPage}
                >
                  Previous
                </button>
                <button
                  className="button"
                  type="button"
                  disabled={pageNumber >= numPages}
                  onClick={nextPage}
                >
                  Next
                </button>
              </div>
            </div>
            <div style={{ position: 'absolute', display: 'none', visibility: 'hidden' }} >
              <Document
                file={reconocimiento}
                onLoadSuccess={onDocumentLoadSuccess}
              >
                <Page className="import-pdf-page" pageNumber={pageNumber} onRenderSuccess={() => {
                  const importPDFCanvas = document.querySelector('.import-pdf-page canvas');
                  const pdfAsImageSrc = importPDFCanvas.toDataURL();
                  if (!pagesImgs.find(i => i === pdfAsImageSrc)) {
                    setPagesImgs(pagesImgs.slice().concat([pdfAsImageSrc]))
                  }
                }} />
              </Document>
            </div>
            {pagesImgs.map((item, index) => index === pageNumber - 1 ? (
              <React.Fragment key={String(index)}>
                <div style={{ margin: '16px' }} >
                  <P5Contianer
                    base64Img={item}
                    widthImg={pagesSize[index].width}
                    heightImg={pagesSize[index].height}
                    imgSignature={imgSignature}
                    widthImgSignature={widthImgSignature}
                    heightImgSignature={heightImgSignature}
                    pageNumber={index}
                    save={(params) => {
                      setPdfFileData(params)
                    }}
                  />
                </div>
              </React.Fragment>
            ) : (
              <React.Fragment key={String(index)} />
            ))}
          </div>
        </>
      )}
      <div className='canvassignaure'  >
        <CanvasDraw
          className='signaturepad'
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
        }} >limpiar canvas</button>
        <button className="button" onClick={() => {
          pad.current.clear();
          setImgSignature(null)
        }} >eliminar firma</button>
        <button className="button" onClick={() => {
          saveSignature()
        }} >guardar firma</button>
      </div>

      {imgSignature && (
        <>
          <img style={{ margin: 16 }} src={imgSignature} alt="Logo" width={400} height={300} />
          <button className="button" onClick={() => {
            setShowPdf(true)
          }} >cargar Pdf</button>
        </>
      )}


    </div>
  );
}
export default App;