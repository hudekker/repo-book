// "use strict";

let limits;
let list;
let boolGist = false;
let boolSubmit;
let username;
let headers;
let sortedBy = "Created";
let titleSearch = document.querySelector("#title-search");
let inputUsername = document.querySelector("#input-username");
let btnSearch = document.querySelector("#btn-search");
let btnGithub = document.querySelector("#btn-github");
let btnGist = document.querySelector("#btn-gist");
let btnDb = document.querySelector("#btn-db");
let btnGo = document.querySelector("#btn-go");

const getNameField = (row) => {
  let rowName;

  if (boolGist) {
    rowName = Object.keys(row.files).length ? Object.values(row.files)[0].filename : "";
  } else {
    rowName = row.name;
  }

  return rowName;
};

let headersTemplate = [
  {
    colName: "Description",
    key: (e) => e.description || getNameField(e),
    boolAscending: true,
    boolGithub: true,
    boolGist: true,
  },
  {
    colName: "Name",
    key: getNameField,
    boolAscending: true,
    boolGithub: true,
    boolGist: true,
  },
  {
    colName: "Pages",
    // key: (e) => (e.has_pages ? "1" : "0"),
    key: (e) => (e.has_pages ? "Y" : "N"),
    boolAscending: true,
    boolGithub: true,
    boolGist: false,
  },
  {
    colName: "Created",
    key: (e) => e.created_at,
    boolAscending: false,
    boolGithub: true,
    boolGist: true,
  },
  {
    colName: "Updated",
    key: (e) => e.updated_at,
    boolAscending: false,
    boolGithub: true,
    boolGist: true,
  },
];

// class GHRequestError extends Error {
//   constructor(limits = {}, ...params) {
//     super(...params);

//     if (Error.captureStackTrace) {
//       Error.captureStackTrace(this, GHRequestError);
//     }

//     this.name = "GHRequestError";
//     this.limits = limits;
//   }
// }

const htmlDescription = (row) => {
  let desc;

  if (boolGist) {
    desc = `
      <a href="${row.html_url}" >
        ${row.description || (Object.keys(row.files).length ? Object.values(row.files)[0].filename : "<em>no description</em>")}
      </a>
    `;

    // Github repo
  } else {
    desc = `
        <a href="${row.html_url}" >
          ${row.description || "<em>no description</em>"}
        </a>
      `;
  }

  return desc;
};

const htmlName = (row) => {
  let name;

  if (boolGist) {
    name = `
    <a href="${row.html_url}" >
        ${getNameField(row) || "<em>no description</em>"}
    </a>
    `;

    // Github repo
  } else {
    name = `
        <a href="${row.html_url}">
          ${row.name || "<em>no name</em>"}
        </a>
      `;
  }

  return name;
};

const hasPages = (row) => {
  return row.has_pages ? "Yes" : "No";
};

const htmlPages = (row) => {
  if (headers.filter((e) => e.colName === "Pages").length < 1) {
    result = "";
  } else {
    if (row.has_pages) {
      result = `
      <td>
        <a href=https://${row.owner.login}.github.io/${row.name}>${hasPages(row)}</a>
      </td>
      `;
    } else {
      result = `
      <td>
        ${hasPages(row)}
      </td>
      `;
    }
  }

  return result;
};

const buildTableRow = (row) => `
  <tr>
    <td>
      ${htmlDescription(row)}
    </td>
    <td>
      ${htmlName(row)}
    </td>
    ${htmlPages(row)}
    <td>
      ${row.created_at.slice(0, 10)}
    </td>
    <td>
      ${row.updated_at.slice(0, 10)}
    </td>
  </tr>
`;

const buildTable = (list) =>
  list.length === 0
    ? "<div>Nothing found</div>"
    : `
  <table>
    <tbody>
      <tr>
        ${headers.map(({ colName }) => `<th>${colName}</th>`).join("")}
      </tr>
      ${list.map(buildTableRow).join("")}
    </tbody>
  </table>
`;

const listenToHeaderClick = (elem) => {
  elem.addEventListener("click", (evt) => {
    let colHeading = evt.target.innerText;

    // Get the function key and default sort direction for this colHeading
    let { key, boolAscending } = headers.find((e) => e.colName === colHeading);

    // sortedBy is global and remembers last col sort.
    // If sorted twice in a row then reverse previous
    if (sortedBy === colHeading) {
      list.reverse();
      boolAscending = elem.classList.contains("sorted-desc");

      // If "new" to this column then always use default sort
      // Use the key() to sort rows
    } else {
      sortedBy = colHeading;
      list.sort((a, b) => key(a).localeCompare(key(b)));

      if (!boolAscending) {
        list.reverse();
      }
    }

    // rebuild the dom using this sorted list
    listToDOM(list);

    // update the asc or desc icon for this colHeading
    showSortedIcon(boolAscending);

    // location.hash = `#{"sortedBy":"${sortedBy}","boolAscending":"${boolAscending}"}`;
    setHashParams({ ...getHashParams(), ...{ sortedBy, boolAscending } });
  });
};

const showSortedIcon = (boolAscending) => {
  document.querySelectorAll(".tbl-search th").forEach((e) => {
    if (e.innerText === sortedBy) {
      e.classList.add(boolAscending ? "sorted-asc" : "sorted-desc");
    }
  });
};

const listToDOM = (list) => {
  // Rebuild the dom using the list in memory
  document.querySelector(".tbl-search").innerHTML = buildTable(list);

  // Add event listeners just for the col headers
  document.querySelectorAll(".tbl-search th").forEach(listenToHeaderClick);
};

const limitsToDOM = (limits) => {
  document.querySelector(".github-limits").innerHTML = `
    <small>
      <em>
        ${limits.remaining}/${limits.limit} API requests remaining.
        Usage resets at ${limits.reset}.
      </em>
    </small>
  `;
};

// const handleGistsResponse = (response) => {
//   ({ limits, gists } = response);
//   limitsToDOM(limits);
//   gistsToDOM(gists);
//   showSortedIcon(headers.find((e) => e.name === sortedBy).ascending);
// };

// const handleError = (err) => {
//   const gistsEl = document.querySelector(".gists");
//   gistsEl.innerHTML = err.message;
//   limitsToDOM(err.limits);
// };

const buildList = async () => {
  try {
    list = [];

    // username = document.querySelector("#input-username").value;

    for (let page = 1; page <= 10; page++) {
      const url = boolGist ? `https://api.github.com/users/${username}/gists?page=${page}&per_page=100` : `https://api.github.com/users/${username}/repos?page=${page}&per_page=100`;

      let response = await fetch(url);

      // const { headers } = response;

      limits = {
        remaining: response.headers.get("x-ratelimit-remaining"),
        limit: response.headers.get("x-ratelimit-limit"),
        reset: new Date(response.headers.get("x-ratelimit-reset") * 1000),
      };

      let data = await response.json();

      if (!response.ok) {
        throw "Nothing found";
      }

      // const { limits: lastLimits, payload: chunk } = await fetchJson(url);
      // limits = lastLimits;

      list.push(...data);

      if (data.length < 100) {
        break;
      }
    }
  } catch (error) {
    console.log(`Error in fetch `, error);
  }

  // sort it
  let { key, boolAscending } = headers.find((e) => e.colName === sortedBy);
  list.sort((a, b) => key(a).localeCompare(key(b)));

  if (!boolAscending) {
    list.reverse();
  }

  // sortedBy is global and it has a default value
  // use the default ascend/descend for the default col heading
  sortList(getHashParams());
  showSortedIcon(headers.find((e) => e.colName === sortedBy).boolAscending);
  document.querySelector("#list-length").textContent = `${list.length} Entries`;

  // location.hash = `#{"sortedBy":"${sortedBy}","boolAscending":"${boolAscending}"}`;
  // setHashParams({ sortedBy, boolAscending });

  limitsToDOM(limits);
  listToDOM(list);
};

const handleGistGithubParams = () => {
  if (boolGist) {
    headers = headersTemplate.filter((e) => e.boolGist);
    btnGithub.classList.remove("on");
    btnGist.classList.add("on");
    inputUsername.placeholder = `Enter a Gist username`;
    titleSearch.innerHTML = `Gist List <span id="list-length"></span>`;
    titleSearch.classList.add("gist");
  } else {
    headers = headersTemplate.filter((e) => e.boolGithub);
    btnGithub.classList.add("on");
    btnGist.classList.remove("on");
    inputUsername.placeholder = `Enter a Github username`;
    titleSearch.innerHTML = `Github List <span id="list-length"></span>`;
    titleSearch.classList.remove("gist");
  }
};

btnGithub.addEventListener("click", (e) => {
  e.preventDefault();

  boolGist = false;
  let hashParams = getHashParams();
  username = document.querySelector("#input-username").value.replace(/\s/g, "");
  setHashParams({ ...hashParams, ...{ boolGist, username } });

  handleGistGithubParams();
  sortedBy = "Created";
  setHashParams({ ...getHashParams(), ...{ sortedBy: "Created", boolAscending: false } });
  // headers = headersTemplate.filter((e) => e.boolGithub);
  // btnGithub.classList.add("on");
  // btnGist.classList.remove("on");
  // inputUsername.placeholder = `Enter a Github username`;
  // titleSearch.innerHTML = `Github List <span id="list-length"></span>`;
  // titleSearch.classList.remove("gist");

  if (username) {
    buildList(username);
  }
  // const searchParams = new URLSearchParams(window.location.ref);
  // searchParams.set("boolGist", "false");
  // searchParams.set("username", `${document.querySelector("#input-username").value}`);
  // searchParams.set("boolSubmit", "false");

  // window.location.search = `?${searchParams.toString()}##${JSON.stringify(getHashParams())}`;
});

const getUsername = () => {
  let l_username = document.querySelector("#input-username").value.replace(/\s/g, "");

  if (l_username === "") {
    l_username = getHashParams()?.username;
    if (l_username) document.querySelector("#input-username").value = l_username;
  }

  return l_username;
};

btnGist.addEventListener("click", (e) => {
  e.preventDefault();

  boolGist = true;
  let hashParams = getHashParams();
  username = getUsername();
  setHashParams({ ...hashParams, ...{ boolGist, username } });

  // headers = headersTemplate.filter((e) => e.boolGist);
  // btnGithub.classList.remove("on");
  // btnGist.classList.add("on");
  // inputUsername.placeholder = `Enter a Gist username`;
  // titleSearch.innerHTML = `Gist List <span id="list-length"></span>`;
  // titleSearch.classList.add("gist");

  handleGistGithubParams();
  sortedBy = "Created";
  setHashParams({ ...getHashParams(), ...{ sortedBy, boolAscending: false } });

  if (username) {
    buildList(username);
  }

  // const searchParams = new URLSearchParams(window.location.ref);
  // searchParams.set("boolGist", "true");
  // searchParams.set("username", `${document.querySelector("#input-username").value}`);
  // searchParams.set("boolSubmit", "false");

  // window.location.search = `?${searchParams.toString()}#${JSON.stringify(getHashParams())}`;
});

btnSearch.addEventListener("click", (event) => {
  event.preventDefault();

  username = getUsername();
  let hashParams = getHashParams();
  // boolGist = hashParams?.boolGist;
  boolGist = hashParams?.boolGist ? true : false;

  let boolDb = hashParams?.boolDb === "true" ? true : false;
  boolSubmit = true;
  setHashParams({ ...hashParams, ...{ boolGist, username, boolSubmit } });

  handleGistGithubParams();

  if (username) {
    buildList(username);
  }
  // const searchParams = new URLSearchParams(window.location.ref);
  // searchParams.set("boolGist", `${boolGist}`);
  // searchParams.set("boolSubmit", `true`);
  // searchParams.set("username", `${document.querySelector("#input-username").value}`);

  // window.location.search = `?${searchParams.toString()}`;
});

btnDb.addEventListener("click", (event) => {
  event.preventDefault();
  btnDb.classList.toggle("on");

  let boolDb = btnDb.classList.contains("on");

  setHashParams({ ...getHashParams(), ...{ boolDb } });
});

const setHashParams = (obj) => {
  let params = JSON.stringify(obj);
  location.hash = params;
};

const getHashParams = () => {
  let params = Object.fromEntries(new URLSearchParams(location.hash.slice(1)));
  if (Object.keys(params)?.length > 0) {
    return JSON.parse(Object.keys(params)[0]);
  }
  return null;
};

const sortList = (obj) => {
  if (!obj?.sortedBy || obj?.boolAscending === undefined) return;

  sortedBy = obj.sortedBy;
  let boolAscending = obj.boolAscending;

  if (sortedBy && list) {
    let { key } = headers.find((e) => e.colName === sortedBy);
    list.sort((a, b) => key(a).localeCompare(key(b)));

    if (!boolAscending) {
      list.reverse();
    }
  }
};

const onLoadRefresh = () => {
  // const searchParams = new URLSearchParams(window.location.search);
  // boolGist = searchParams.get("boolGist") === "true";
  // boolSubmit = searchParams.get("boolSubmit") === "true";
  // username = searchParams.get("username");

  let hashParams = getHashParams();
  boolGist = hashParams?.boolGist;
  boolSubmit = hashParams?.boolSubmit;
  username = hashParams?.username;
  let boolDb = hashParams?.boolDb;
  document.querySelector("#input-username").value = username;

  if (boolGist) {
    // location.hash = "";
    headers = headersTemplate.filter((e) => e.boolGist);
    btnGithub.classList.remove("on");
    btnGist.classList.add("on");
    inputUsername.placeholder = `Enter a Gist username`;
    titleSearch.innerHTML = `Gist List <span id="list-length"></span>`;
    titleSearch.classList.add("gist");
  } else {
    // location.hash = "";
    headers = headersTemplate.filter((e) => e.boolGithub);
    inputUsername.placeholder = `Enter a Github username`;
    titleSearch.innerHTML = `Github List <span id="list-length"></span>`;
  }

  if (boolDb) {
    btnDb.classList.add("on");
  }

  if (username && boolSubmit) {
    buildList(username);
  } else {
    setHashParams({ ...getHashParams(), ...{ boolDb } });
  }
};

btnSearch.click();

// onLoadRefresh();
