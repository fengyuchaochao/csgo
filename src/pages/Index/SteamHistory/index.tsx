import React, { useEffect, useState } from 'react';

const SteamHistory: React.FC<unknown> = () => {
  const [html, setHtml] = useState('');

  const getSteamHistoryData = async () => {
    const url = `/market/myhistory/render/?query=&start=1&count=1`;
    const { results_html } = await fetch(url).then((response) =>
      response.json(),
    );
    console.log(12312, results_html);
    setHtml(results_html);
  };

  useEffect(() => {
    getSteamHistoryData();
  }, []);
  return <div dangerouslySetInnerHTML={{ __html: html }}></div>;
};

export default SteamHistory;
