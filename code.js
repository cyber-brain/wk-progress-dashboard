let apiTokenInput = document.getElementById("api-key");
let apiTokenStorageKey = "apiTokenV2"
let statisticSelect = document.getElementById("statistic");
let confirmBtn = document.getElementById("confirm-btn");
let dataDiv = document.querySelector("div.data");

confirmBtn.addEventListener("click", updateStatistics);

function getApiToken() {
    let token = localStorage.getItem(apiTokenStorageKey);
    if (token) {
        return token;
    } else {
        let token = apiTokenInput.value;
        if (token) {
            localStorage.setItem(apiTokenStorageKey, token);
            return token;
        } else {
            alert("Please input API Token");
            throw Error("apiTokenUnavailable");
        }
    }
}

function updateStatistics() {
    try {
        var apiToken = getApiToken();
    } catch (e) {
        return;
    }
    let statistic = statisticSelect.value;
    fetchStats(statistic, apiToken);
}

function fetchStats(statistic, apiToken) {
    if (statistic === "level-ups") {
        // createLevelUpTable(apiToken);
        try {
            loadLevelData(apiToken).then(
                data => {createLevelUpChart(data)}
            )
        } catch (error) {
            debugger;
        }

    } else if (statistic === "review-accuracy") {
        alert("this statistic is not implemented");
    } else {
        alert("this statistic is not implemented");
    }
}

async function queryWkAPI(endpoint, apiToken) {
    let apiReq = new Request(
        `https://api.wanikani.com/v2/${endpoint}`,
        {
            method: 'GET',
            headers: {Authorization: `Bearer ${apiToken}`,}
        }
    );
    return fetch(apiReq).then(resp => resp.json());
}

function preProcessData(data) {
    return data.map(d => ({
        ...d,
        unlockedToPassed: (d.passed_at - d.unlocked_at) / (1000 * 3600 * 24),
        startedToPassed: (d.passed_at - d.started_at) / (1000 * 3600 * 24)
      }))
}

function createLevelUpChart(data) {
    data = preProcessData(data);
    const svgH = 480;
    const svgW = 920;
    const svgMargin = {top:20, right:20, left:20, bottom:20};

    let values = data.map(d => d.unlockedToPassed).slice(0, data.length - 1)
    let levels = data.map(d => d.level).slice(0, data.length - 1)
    y = d3
        .scaleLinear()
        .domain([0, d3.max(values)])
        .range([svgH - svgMargin.bottom, svgMargin.top])
    x = d3
        .scaleBand()
        .domain(levels)
        .rangeRound([svgMargin.left, svgW - svgMargin.right])
        .padding(0.1)

    const svg = d3.select("div.data")
        .append("svg")
            .attr("width", svgW)
            .attr("height", svgH)
            .style("background-color", "papayawhip");

    svg
        .selectAll("rect")
        .data(values)
        .join("rect")
        .attr("transform", (d, i) => `translate(${x(levels[i])})`)
        .attr("height", (d, i) => y(0) - y(d))
        .attr("width", x.bandwidth())
        .attr("y", (d, i) => y(d))
        .attr("fill", "coral");

    svg
        .append("g")
        .attr("transform", `translate(${svgMargin.left},0)`)
        .call(d3.axisLeft(y));

    svg
        .append("g")
        .attr("transform", `translate(0, ${y(0)})`)
        .call(d3.axisBottom(x));
}

async function createLevelUpTable(apiToken) {
    let levelUpData = await queryWkAPI("level_progressions", apiToken);

    let fields = [
        {n: "level", f: d => d.level},
        {n: "unlocked", f: d => dateFmt(d.unlocked_at)},
        {n: "started", f: d => dateFmt(d.started_at)},
        {n: "passed", f: d => dateFmt(d.passed_at)},
        {n: "days since unlocked", f: d => {
            return ((Date.parse(d.passed_at) - Date.parse(d.unlocked_at)) / (1000*60*60*24)).toFixed(1);
        }},
        {n: "days since started", f: d => {
            return ((Date.parse(d.passed_at) - Date.parse(d.started_at)) / (1000*60*60*24)).toFixed(1);
        }},
    ]
    levelUpData = levelUpData.data.map(e => {
        return fields.map(f => f.f(e.data))
    });
    dataDiv.innerHTML = "";
    dataDiv.appendChild(createTable(fields.map(f => f.n), levelUpData));
}

function dateFmt(d) {
    if (d) {
        return moment(d).format("YYYY-MM-DD HH:mm");
    } else {
        return "";
    }

}


function createTable(header, rows) {
    let table = document.createElement("table");
    let thead = createTableHead(header);
    let tbody = createTableBody(rows);
    table.appendChild(thead);
    table.appendChild(tbody);
    return table;
}

function createTableHead(headers) {
    let thead = document.createElement("thead");
    let tr = document.createElement("tr");
    headers.forEach(h => {
        let th = document.createElement("th");
        th.textContent = h;
        tr.appendChild(th);
    })
    thead.appendChild(tr);
    return thead;
}

function createTableBody(rows) {
    let tbody = document.createElement("tbody");
    rows.forEach(r => tbody.appendChild(createTableRow(r)));
    return tbody;
}

function createTableRow(values) {
    let tr = document.createElement("tr");
    for (let v of values) {
        let td = document.createElement("td");
        td.textContent = v;
        tr.appendChild(td);
    }
    return tr
}


async function getWkItems(endpoint, apiToken) {
    let reqOpts = {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiToken}` }
    };
    let resuts = new Array();

    let nextUrl = `https://api.wanikani.com/v2/${endpoint}`;
    while (nextUrl) {
        let resp = await fetch(nextUrl, reqOpts);
        if (resp.ok) {
        let body = await resp.json();
        nextUrl = body.pages.next_url;
        resuts.push(...body.data);
        } else {
        throw Error(`${resp.status}: ${resp.statusText}`);
        }
    }
    return resuts;
}

async function loadLevelData(apiToken) {
    const data = await getWkItems("level_progressions", apiToken);
    return data.map(d => ({
        level: d.data.level,
        started_at: Date.parse(d.data.started_at),
        passed_at: Date.parse(d.data.passed_at),
        unlocked_at: Date.parse(d.data.unlocked_at)
    }));
}
