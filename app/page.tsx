"use client"

import { useState } from 'react';
import { Client } from "@gradio/client";

const Index = () => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryResults, setFileSummaryResults] = useState<string | null>(null);
  const [fileAnalysisResults, setFileAnalysisResults] = useState<string | null>(null);
  const [shapeAnalysisResults, setShapeAnalysisResults] = useState<string | null>(null);
  const [filePathImgResults, setFilePathImgResults] = useState<string | null>(null);
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setLoading(true);
      setError(null);
      setFileBlob(file); // Set the file as a Blob

      try {
        const client = await Client.connect("https://7a71f76778687a056d.gradio.live/");
        
        const result = await client.predict("/process_file", { 
          file: file, 
        });

        console.log(result);

        setFileSummaryResults((result.data as string[])[0]);
        setFileAnalysisResults((result.data as string[])[1]);
        setShapeAnalysisResults((result.data as string[])[2]);
        setFilePathImgResults((result.data as { url: string }[])[3].url);

      } catch (error) {
        console.error("Error processing DXF file:", error);
        setError('Failed to process DXF file.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <input
        type="file"
        onChange={handleFileChange}
        accept=".dxf"
        className="mb-4 p-2 bg-gray-800 rounded"
      />
      
      
      {fileName && <p>File: {fileName}</p>}
      {error && <p className="text-red-500">{error}</p>}
      {loading && <p className="text-yellow-400">Loading...</p>}

      <div className='grid grid-cols-2 grid-rows-1 justify-center gap-4 items-start'>
      {filePathImgResults && (
          <div className="mt-4 p-4 bg-gray-800 rounded text-sm">
            <h3 className="text-lg font-semibold mb-2">Path Image:</h3>
            <img src={filePathImgResults} alt={`Output for ${fileName}`} />
          </div>
        )}

        {summaryResults && (
          <div className="mt-4 p-4 bg-gray-800 rounded text-sm">
            <h3 className="text-lg font-semibold mb-2">Summary Results:</h3>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{summaryResults}</pre>
          </div>
        )}
        
        {fileAnalysisResults && (
          <div className="mt-4 p-4 bg-gray-800 rounded text-sm">
            <h3 className="text-lg font-semibold mb-2">File Analysis Results:</h3>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{fileAnalysisResults}</pre>
          </div>
        )}

        {shapeAnalysisResults && (
          <div className="mt-4 p-4 bg-gray-800 rounded text-sm">
            <h3 className="text-lg font-semibold mb-2">Shape Analysis Results:</h3>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{shapeAnalysisResults}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;