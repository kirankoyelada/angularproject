import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
  BasicSearchRequest,
  BasicSearchResponse,
  BasicSearch,
  MarcRecord,
  SearchResponse,
  AuthoritySearchResponse,
  Z3950SearchRequest
} from "./search";
import { Observable, of, forkJoin } from "rxjs";
import { Z3950Profile } from '../Z39.50Profile/model/z3950';
import { ConfigurationService } from './configuration.service';

const httpOptions = {
  headers: new HttpHeaders({
    "Content-Type": "application/json"
  })
};

@Injectable({
  providedIn: "root"
})
export class SearchService {
  _baseURL: string;
  _feedSources: string;
  _inboundHostAddress: string;

  constructor(private http: HttpClient, private configurationService: ConfigurationService) {
    this._baseURL = configurationService.currentConfiguration().apiURL;
    this._feedSources = configurationService.currentConfiguration().feedSources;
    this._inboundHostAddress = configurationService.currentConfiguration().inBoundHostAddress;
  }

  response: BasicSearchResponse;

  basicSearch(request: BasicSearch[]): Observable<SearchResponse> {
    let searchRequest = JSON.stringify(request);
    let url = this._baseURL + "/api/Search/LocalSearch";
    return this.http.post<SearchResponse>(url, searchRequest, httpOptions);
  }

  basicAuthSearch(request: BasicSearch[]): Observable<AuthoritySearchResponse> {
    let searchRequest = JSON.stringify(request);
      let url = this._baseURL + "/api/Search/AuthoritySearch";
      return this.http.post<AuthoritySearchResponse>(url, searchRequest, httpOptions);
  }

  saveSearchHistory(request: any): Observable<string> {
    let url = this._baseURL + "/api/SearchHistory/saveHistory";
    let data = JSON.stringify(request);
    return this.http.post<string>(url, data, httpOptions)
  }
  getSearchHistory(userId: string): Observable<any> {
    let url = this._baseURL + "/api/SearchHistory/history?userId=" + userId;
    return this.http.get<any>(url);
  } 

  getZ3950Search(request: any): Observable<SearchResponse> {
    let searchRequest = JSON.stringify(request);
    let url = this._baseURL + "/api/z3950search/search";
    return this.http.post<SearchResponse>(url, searchRequest, httpOptions);
  }

  getAllZ3950SearchResult(request: Z3950SearchRequest): Observable<SearchResponse[]> {
      return this.getAllZ3950SearchResultWithIndex(request,0);
  }
  
  getAllZ3950SearchResultWithIndex(request: Z3950SearchRequest,index:number): Observable<SearchResponse[]> {   
    let searchResponses: any = [];   
    let Profiles :Z3950Profile[];
   
    const url = this._baseURL + "/api/z3950search/search";
   
    var inboundProfile=request.Profiles.find(x=>x.hostAddress == this._inboundHostAddress);
    var sources:string[] = this._feedSources.split(',');
    var inboundProfileIndex=request.Profiles.findIndex(x=>x.hostAddress == this._inboundHostAddress);

    if(inboundProfileIndex!=-1){
      request.Profiles.splice(inboundProfileIndex,1);
      sources.forEach(source => {  
        let zProfile = new Z3950Profile;
        zProfile=Object.assign({}, inboundProfile);
        zProfile.inBoundSource=source;
        request.Profiles.push(zProfile);
      });
    }
    Profiles = request.Profiles;
    
    const pageCount= 30/(request.PageSize);      
    for(let x=0;x<Profiles.length;x++)
    { 
      request.Profiles=[];
      request.Profiles.push(Profiles[x]);  
      for(let i = 0; i < pageCount ; i++){
        request.PageIndex =  (index * pageCount)+i;
        let searchRequest = JSON.stringify(request);
        searchResponses.push(this.http.post<SearchResponse>(url, searchRequest, httpOptions));
      }
    } 
    return forkJoin(searchResponses);
  }
}
